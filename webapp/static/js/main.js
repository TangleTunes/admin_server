const CHUNK_SIZE = 32500
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

async function get_chunks(file) {
    const chunks = [];
  
    // Read the file in chunks
    for (let i = 0; i < file.size; i += CHUNK_SIZE) {
        // Load chunk
        const reader = new FileReader();
        reader.readAsArrayBuffer(file.slice(i, i + CHUNK_SIZE));
        await new Promise(resolve => reader.addEventListener("load", resolve));
  
        // Compute keccak hash value
        const hash = web3.utils.soliditySha3(new Uint8Array(reader.result));
        chunks.push(hash);
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
    let chunks = await get_chunks(file)

    return { name, price, length, duration, chunks }
}

async function upload() {
    const addr = document.getElementById('contract').value
    const abi = await fetch('/static/abi.json').then(res => res.json())
    const contract = new web3.eth.Contract(abi, addr);

    let author = (await web3.eth.getAccounts())[0]
    document.getElementById('song_info').innerHTML = "Processing song..."
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
    ).send({
        from: (await web3.eth.getAccounts())[0]
    })
}


if (window.ethereum) {
    window.ethereum.request({method: 'eth_requestAccounts'})
    web3 = new Web3(window.ethereum)
} else {
    alert('Metamask is not connected to tangletunes')
}