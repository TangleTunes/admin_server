const CHUNK_SIZE = 32500
let web3
let contract

function weiToMiota(value) {
    res = parseInt(value.toString().slice(0,-12))
    return res ? res / 1_000_000 : 0
}

function MiotaToWei(value) {
    return Math.round(value * 1e18)
}

async function login(form) {
    const addr = (await web3.eth.getAccounts())[0]
    try {
        if (form) {
            form["signature"].value = await web3.eth.personal.sign(form["nonce"].value, addr)
            return form.submit()
        }
    } catch {}
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
    const addr = document.getElementById('contract').value
    const abi = await fetch('/static/abi.json').then(res => res.json())
    const contract = new web3.eth.Contract(abi, addr);

    await contract.methods.create_user(
        document.getElementById("username").value,
        document.getElementById("description").value,
    ).send({
        from: (await web3.eth.getAccounts())[0]
    })

    //Reload Page to be redirected
    window.location.reload()
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

function get_chunks(buffer, len) {
    const chunks = [];
    for (let i = 0; i < len; i += CHUNK_SIZE) {
        // Get chunk as hex string
        const chunk_buf = buffer.slice(i, i + CHUNK_SIZE)
        const chunk = '0x'+[...new Uint8Array(chunk_buf)].map(x => x.toString(16).padStart(2,'0')).join('')
        // Compute keccak hash value
        chunks.push(web3.utils.soliditySha3(chunk));
    }
    return chunks;
}

async function get_upload_values(form) {
    const name = form['name'].value
    const price = MiotaToWei(parseFloat(form['price'].value)).toString()
    const buffer = await (await fetch('/static/uploads/'+form['id'].value)).arrayBuffer()
    const length = buffer.byteLength
    const chunks = get_chunks(buffer, length)
    const duration = Math.round(form.getElementsByTagName("audio")[0].duration)
    
    return { name, price, length, duration, chunks }
}

async function upload(form, button) {
    if (button.value != 'true') return form.submit()
    form["approved"].value = 'true'
    button.innerText = 'Processing'
    button.ariaBusy = 'true'

    const addr = form['contract'].value
    const abi = await fetch('/static/abi.json').then(res => res.json())
    const contract = new web3.eth.Contract(abi, addr);

    const author = form['author'].value
    const song = await get_upload_values(form)

    button.innerText = 'Approve'
    button.ariaBusy = 'false'

    await contract.methods.upload_song(
        author,
        song.name,
        song.price,
        song.length,
        song.duration,
        song.chunks
    ).send({
        from: (await web3.eth.getAccounts())[0]
    })

    form.submit()
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
    alert('Metamask is not connected to tangletunes')
}