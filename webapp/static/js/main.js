const CHUNK_SIZE = 32500
let web3

function weiToMiota(value) {
    res = parseInt(value.toString().slice(0,-12))
    return res ? res / 1_000_000 : 0
}

function MiotaToWei(value) {
    return Math.round(value * 1e18)
}

async function login(form) {
    if (!form) return
    button = form["submit_button"]
    button.ariaBusy = "true"
    button.innerText = "Sign nonce"

    const addr = (await web3.eth.getAccounts())[0]
    try {
        form["signature"].value = await web3.eth.personal.sign(form["nonce"].value, addr)
        return form.submit()
    } catch {
        button.ariaBusy = "false"
        button.innerText = "Sign in"
    }
}

async function refresh_balance() {
    let balance = await web3.eth.getBalance((await web3.eth.getAccounts())[0])
    balance = weiToMiota(parseInt(balance))
    document.getElementById("balance").innerHTML = `Your current balance is <b>${balance} Mi</b>`
    setTimeout(refresh_balance, 1000);
}

async function request_funds() {
    const button = document.getElementById("request_button")
    button.innerText = "Requesting"
    button.ariaBusy = "true"

    await fetch(`/debug/faucet/${(await web3.eth.getAccounts())[0]}`)
    button.ariaBusy = "false"
    button.innerText = "Requested"
    button.disabled = true
}

async function register() {
    const button = document.getElementById("register_button")
    button.ariaBusy = "true"
    button.innerText = "Sign transaction"

    const addr = document.getElementById('contract').value
    const abi = await fetch('/static/abi.json').then(res => res.json())
    const contract = new web3.eth.Contract(abi, addr);

    try {
        await contract.methods.create_user(
            document.getElementById("username").value,
            document.getElementById("description").value,
        ).send({
            from: (await web3.eth.getAccounts())[0]
        })
        
        //redirect to request page
        button.innerText = "Registering"
        await new Promise(resolve => setTimeout(resolve, 1500));
        window.location = "/validator/request";
    } catch {
        button.ariaBusy = "false"
        button.innerText = "Register"
    }
}

async function fill_info() {
    //fill and verify author addres and name 
    const author = document.getElementById("author_addr")
    author.value = (await web3.eth.getAccounts())[0]
    await update_author()
    author.addEventListener('change', update_author)

    //verify price
    await update_price_equiv()
    document.getElementById("price").addEventListener('change', update_price_equiv)
    document.getElementById("file").addEventListener('change', update_price_equiv)
}

async function update_author() {
    const addr = document.getElementById('contract').value
    const abi = await fetch('/static/abi.json').then(res => res.json())
    const contract = new web3.eth.Contract(abi, addr);

    const author = document.getElementById("author_addr")
    const author_name = document.getElementById("author_name")
    try {
        const user = await contract.methods.users(author.value).call()
        author_name.value = user.username
        author.ariaInvalid = "false"
    } catch {
        author_name.value = ""
        author.ariaInvalid = "true"
    }
    
}

async function update_price_equiv() {
    const price_equiv = document.getElementById("price_equiv")
    try {
        const price = parseFloat(document.getElementById("price").value)
        const seconds = await get_duration(document.getElementById('file').files[0])
        price_equiv.ariaInvalid = false
        price_equiv.value = Number(price /seconds * 60).toFixed(6)
    } catch {
        price_equiv.ariaInvalid = true
        price_equiv.value = "0.00"
    }
}

function get_duration(file) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(URL.createObjectURL(file));
        audio.addEventListener('loadedmetadata', () => resolve(Math.round(audio.duration)));
        audio.addEventListener('error', () => reject(new Error('Error loading MP3 file')));
    });
}

function song_price_to_chunk_price(price, length) {
    const p = MiotaToWei(parseFloat(price))
    const chunks = Math.floor(length/CHUNK_SIZE)
    return Math.floor(p/chunks).toString()
}

async function request(form) {
    if (!form) return
    button = form["submit_button"]
    button.ariaBusy = "true"
    button.innerText = "Sign request"

    const addr = (await web3.eth.getAccounts())[0]
    const buffer = await form["file"].files[0].arrayBuffer()
    try {
        form["sig"].value = await web3.eth.personal.sign(
            web3.utils.soliditySha3(
                web3.utils.encodePacked(
                    {value: form["author_addr"].value, type: 'address'}, //author
                    {value: form["name"].value, type: 'string'}, //name
                    {value: song_price_to_chunk_price(form['price'].value, buffer.byteLength), type: 'uint256'}, // price
                    {value: buffer.byteLength, type: 'uint256'}, // length
                    {value: await get_duration(form["file"].files[0]), type: 'uint256'}, // duration
                    {value: get_chunks(buffer), type: 'bytes32[]'}, // chunks
                    {value: parseInt(form["nonce"].value), type: 'uint256'} // nonce
                )
            ),
            addr
        );
        return form.submit()
    } catch {
        button.ariaBusy = "false"
        button.innerText = "Request song"
    }
}

function get_chunks(buffer) {
    const chunks = [];
    for (let i = 0; i < buffer.byteLength; i += CHUNK_SIZE) {
        // Get chunk as hex string
        const chunk_buf = buffer.slice(i, i + CHUNK_SIZE)
        const chunk = '0x'+[...new Uint8Array(chunk_buf)].map(x => x.toString(16).padStart(2,'0')).join('')
        // Compute keccak hash value
        chunks.push(web3.utils.soliditySha3(chunk));
    }
    return chunks;
}

async function upload(form, button) {
    if (button.value != 'true') return form.submit()
    form["approved"].value = 'true'
    button.innerText = 'Sign transaction'
    button.ariaBusy = 'true'

    const addr = form['contract'].value
    const abi = await fetch('/static/abi.json').then(res => res.json())
    const contract = new web3.eth.Contract(abi, addr);

    const buffer = await (await fetch('/static/uploads/'+form['id'].value)).arrayBuffer()
    try {
        await contract.methods.upload_song(
            form['author'].value,
            form['name'].value,
            song_price_to_chunk_price(form['price'].value, buffer.byteLength),
            buffer.byteLength,
            Math.round(form.getElementsByTagName("audio")[0].duration),
            get_chunks(buffer),
            form["nonce"].value,
            form["sig"].value
        ).send({
            from: (await web3.eth.getAccounts())[0]
        })
        return form.submit()
    } catch {
        button.innerText = 'Approve'
        button.ariaBusy = 'false'
    }
}

if (window.ethereum) {
    //Request access to Metamask accounts
    window.ethereum.request({method: 'eth_requestAccounts'})
    //Create provider object connected to Metamask
    web3 = new Web3(window.ethereum)
    //Reload web application when wallet account changes
    window.ethereum.on('accountsChanged', function () {
        //Clear cookies: https://stackoverflow.com/questions/179355/clearing-all-cookies-with-javascript
        document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/,"").replace(/=.*/,"=;expires="+new Date().toUTCString()+";path=/"); 
        });
        //Reload page
        window.location.reload()
      })
} else {
    try {
        document.getElementById("submit_button").disabled = true
    } catch { }
}