let web3
let contract
let map
let focused_marker
let markers = []

const DefaultIcon = L.divIcon({
    className: "DefaultIcon",
    iconAnchor: [0, 0],
    html: `<span style="
                background-color: #143a82;
                width: 1rem;
                height: 1rem;
                left: -0.5rem;
                top: -0.5rem;
                position: relative;
                display: block;
                border-radius: 3rem 3rem 3rem;
                "
            />`
})

const HoverIcon = L.divIcon({
    className: "HoverIcon",
    iconAnchor: [0, 0],
    html: `<span style="
                background-color: #fe741e;
                width: 1.5rem;
                height: 1.5rem;
                left: -0.75rem;
                top: -1.75rem;
                position: relative;
                display: block;
                border-radius: 3rem 3rem 0rem;
                transform: rotate(45deg);
                "
            />`
})

function load_containers() {
    fill_songs()
    init_map()
}

async function fill_songs() {
    if (!contract) return setTimeout(fill_songs, 200)

    const songs_size = await contract.methods.song_list_length().call()
    const songs = await contract.methods.get_songs(0, songs_size).call()

    let options = '<option value="" disabled selected>Select</option>\n'
    songs.forEach((song) => options += `<option value="${song.song_id}">${song.song_name} by ${song.author_name}</option>`)
    document.getElementById("songs").innerHTML = options
}

function init_map() {
    //https://stackoverflow.com/a/41753557/16131601
    let element = document.getElementById('osm-map');
    element.style = 'height:100%;';
    map = L.map(element, { 
        zoomControl: false,
        scrollWheelZoom: false
    });
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    map.setView([50,15],3)
}

async function change_song(song_id) {
    //Clear map
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer)
        }
    })
    markers = []
    focused_marker = undefined
    map.setView([50,15],3)

    document.getElementById("distributors").innerHTML = ""
    await fill_distributors(song_id)

    //Keep updating until song changes again
    setTimeout(() => {update_loop(song_id)}, 500)
}

async function update_loop(song_id) {
    //stop loop if selected song changed
    if (document.getElementById("songs").value != song_id) return

    const size = await contract.methods.get_distributors_length(song_id).call()
    if (size != markers.length) {
        change_song(song_id)
    } else {
        setTimeout(() => {update_loop(song_id)}, 500)
    }
}

function change_marker(id, m) {
    if (markers[id].marker) markers[id].marker = markers[id].marker.setIcon(m)
}

function focus_marker(id) {
    if (focused_marker != id) {
        if (focused_marker != undefined) change_marker(focused_marker, DefaultIcon)
        change_marker(id, HoverIcon)
        if (markers[id].location) map.setView(markers[id].location, 4)
        focused_marker = id
    }
}

function unfocus() {
    if (focused_marker != undefined) {
        change_marker(focused_marker, DefaultIcon)
        map.setView([50,15],3)
        focused_marker = undefined
    }
}

function weiToMiota(value) {
    res = parseInt(value.toString().slice(0,-12))
    return res ? res / 1_000_000 : 0
}

function chunk_fee_to_song(value, duration, chunks) {
    try {
        return Number(weiToMiota(value) * chunks / duration * 60).toFixed(6)
    } catch {
        return 0.0
    }
}

async function fill_distributors(song_id) {
    const distributors_size = await contract.methods.get_distributors_length(song_id).call()
    if (distributors_size == 0) return
    
    const distributors = await contract.methods.get_distributors(song_id, "0x0000000000000000000000000000000000000000", distributors_size).call()
    const song = await contract.methods.songs(song_id).call()
    const song_chunks = await contract.methods.chunks_length(song_id).call()
    const author_name = (await contract.methods.users(song.author).call()).username

    let articles = `
    <article style="padding: 0; margin-top: 0">
        <p align="center" style="margin-bottom: 0"><b>${song.name}</b></p>
        Author: <b>${author_name}</b> (${song.author.slice(0,6)}...) <br>
        Price: <b>${chunk_fee_to_song(song.price, song.duration, song_chunks)} Mi/min</b>
    </article>
    `
    for (let i = 0; i < distributors.length; i++) {
        const username = (await contract.methods.users(distributors[i].distributor).call()).username
        articles += `
        <button class="secondary" onmouseenter="focus_marker(${i})">
            <div class="grid">
                <div>
                    <b>${username}</b> (${distributors[i].distributor.slice(0,6)}...)
                    <br>
                    ${distributors[i].server}
                </div>
                <div align="center">
                    <h2 style="margin-bottom: 0;">${chunk_fee_to_song(distributors[i].fee, song.duration, song_chunks)} Mi/min</h2>
                </div>
            </div>
        </button>
        `

        await add_map_marker(distributors[i].server.split(":")[0])
    }
    document.getElementById("distributors").innerHTML = articles
}

async function add_map_marker(ip) {
    try {
        const data = await fetch(`http://www.geoplugin.net/json.gp?ip=${ip}`).then(res => res.json())
        const location = [data.geoplugin_latitude, data.geoplugin_longitude]
        const marker = L.marker(location, {
            icon: DefaultIcon
        }).addTo(map);

        markers.push({
            marker: marker,
            location: location
        })
    } catch (error) {
        console.log(`Marker for ${ip} could not be placed: ${error}`)
        markers.push({})
    }
}

if (window.ethereum) {
    //Request access to Metamask accounts
    window.ethereum.request({method: 'eth_requestAccounts'})
    //Create provider object connected to Metamask
    web3 = new Web3(window.ethereum)
    //Create contract object
    fetch('/static/abi.json')
        .then(res => res.json())
        .then(abi => contract = new web3.eth.Contract(abi, document.getElementById('contract').value))
} else {
    alert('Metamask is not connected to tangletunes')
}