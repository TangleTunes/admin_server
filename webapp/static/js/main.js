const CHUNK_SIZE = 30000
let web3
let contract

async function login(form) {
    let addr = (await web3.eth.getAccounts())[0]
    let nonce = document.getElementById("nonce").value
    try {
        document.getElementById("signature").value = await web3.eth.personal.sign(nonce, addr)
        if (form) form.submit()
    } catch {}
}

async function connect() {
    let addr = document.getElementById('contract').value
    let abi = await fetch('/static/abi.json').then(res => res.json())
    contract = new web3.eth.Contract(abi, addr);
    load_user()
}

async function load_user() {
    let addr = (await window.ethereum.request({ method: 'eth_requestAccounts' }))[0]
    let user = await contract.methods.users(addr).call()
    if (!user.exists) {
        document.getElementById('user_info').innerHTML = 'You do not have a user account'
    } else if (!user.is_validator) {
        document.getElementById('user_info').innerHTML = 'You are not a validator'
    } else {
        document.getElementById('user_info').innerHTML = `<p><b>Name:</b> ${user.username}</p>\n<p><b>Desc:</b> ${user.description}</p>\n<p><b>Balance:</b> ${user.balance}</p>\n`
    }
}

async function get_chunks(file) {
    const chunks = [];
  
    // Read the file in chunks
    for (let i = 0; i < file.size; i += CHUNK_SIZE) {
      const reader = new FileReader();
      await new Promise(resolve => reader.addEventListener("load", resolve));
      reader.readAsArrayBuffer(file.slice(i, i + CHUNK_SIZE));
      const chunk_buffer = new Uint8Array(reader.result);
  
      // Compute keccak hash value
      const hash = await window.crypto.subtle.digest("SHA3-256", chunk_buffer);
      const hashArray = Array.from(new Uint8Array(hash));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      chunks.push(hashHex);
    }
  
    return chunks;
}

function get_duration(file) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(URL.createObjectURL(file));
        audio.addEventListener('loadedmetadata', () => resolve(Math.ceil(audio.duration)));
        audio.addEventListener('error', () => reject(new Error('Error loading MP3 file')));
    });
}

async function get_upload_values() {
    let name = document.getElementById('name').value
    let price = document.getElementById('price').value
    let file = document.getElementById('file').files[0]
    let length = file.size
    let duration = await get_duration(file)
    let chunks = get_chunks(file)

    return { name, price, length, duration, chunks }
}

async function upload() {
    let author = (await window.ethereum.request({ method: 'eth_requestAccounts' }))[0]
    let song = await get_upload_values()
    document.getElementById('song_info').innerHTML = `
        <p><b>Author:</b> ${author}</p>
        <p><b>Name:</b> ${song.name}</p>
        <p><b>Price:</b> ${song.price}</p>
        <p><b>Duration:</b> ${song.duration}</p>
        <p><b>Length:</b> ${song.length}</p>
        <p><b>Chunks:</b> ${song.chunks}</p>
    `

    await contract.methods.upload_song(
        author,
        song.name,
        song.price,
        song.length,
        song.duration,
        song.chunks
    ).send()
}


if (window.ethereum) {
    web3 = new Web3(window.ethereum)
} else {
    alert('Metamask is not connected to tangletunes')
}