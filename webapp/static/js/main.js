const CHUNK_SIZE = 32500
let web3
let contract

function weiToMiota(value) {
    res = parseInt(value.toString().slice(0,-12))
    return res ? res / 1_000_000 : 0
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

async function fill_author() {
    const author = document.getElementById("author_addr")
    author.value = (await web3.eth.getAccounts())[0]
    await update_author()

    author.addEventListener('change', update_author)
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
    let name = form['name'].value
    let price = form['price'].value
    let buffer = await (await fetch('/static/uploads/'+form['id'].value)).arrayBuffer()
    let length = buffer.byteLength
    let chunks = get_chunks(buffer, length)
    let duration = Math.floor(form.getElementsByTagName("audio")[0].duration)
    
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