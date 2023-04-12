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
                width: 2rem;
                height: 2rem;
                left: -1rem;
                top: -1rem;
                position: relative;
                display: block;
                border-radius: 3rem 3rem 3rem;
                "
            />`
})

function load_containers() {
    fill_songs()
    init_map()
}

async function fill_songs() {
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

    await fill_distributors(song_id)
}

function focus_marker(id) {
    if (focused_marker != id) {
        if (focused_marker) markers[focused_marker].marker.setIcon(DefaultIcon)
        markers[id].maker.setIcon(HoverIcon)
        map.setView(markers[id].location,4)
        focused_marker = id
    }
}

async function fill_distributors(song_id) {
    const distributors_size = await contract.methods.get_distributors_length(song_id).call()
    const distributors = await contract.methods.get_distributors(song_id, "0x0000000000000000000000000000000000000000", distributors_size).call()

    let articles = '\n'
    for (let i = 0; i < distributors.length; i++) {
        const username = (await contract.methods.users(distributors[i].distributor).call()).username
        articles += `
        <button class="secondary" onmouseover="focus_marker(${i})">
            <div class="grid">
                <div>
                    <b>${username}</b> (${distributors[i].distributor.slice(0,6)}...)
                    <br>
                    ${distributors[i].server}
                </div>
                <div align="center">
                    <h2 style="margin-bottom: 0;">${distributors[i].fee} wei</h2>
                </div>
            </div>
        </button>
        `
        add_map_marker(distributors[i].server.split(":")[1])
    }
    document.getElementById("distributors").innerHTML = articles
}

function add_map_marker(ip, id) {
    fetch(`http://www.geoplugin.net/json.gp?ip=${ip}`)
        .then(res => res.json())
        .then(data => {
            const location = [data.geoplugin_latitude, data.geoplugin_longitude]
            const marker = L.marker(location, {
                icon: DefaultIcon
            }).addTo(map);

            markers.push({
                maker: marker,
                location: location
            })
        })
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