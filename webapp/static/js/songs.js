let web3

async function fill_songs() {
    const addr = document.getElementById('contract').value
    const abi = await fetch('/static/abi.json').then(res => res.json())
    const contract = new web3.eth.Contract(abi, addr);

    const songs_size = await contract.methods.song_list_length().call()
    const songs = await contract.methods.get_songs(0, songs_size).call()

    let options = '<option value="" disabled selected>Select</option>\n'
    songs.forEach((song) => options += `<option value="${song.song_id}">${song.song_name} by ${song.author_name}</option>`)
    document.getElementById("songs").innerHTML = options
}

async function update_distributors(song_id) {
    const addr = document.getElementById('contract').value
    const abi = await fetch('/static/abi.json').then(res => res.json())
    const contract = new web3.eth.Contract(abi, addr);

    const distributors_size = await contract.methods.get_distributors_length(song_id).call()
    const distributors = await contract.methods.get_distributors(song_id, "0x0000000000000000000000000000000000000000", distributors_size).call()

    let articles = '\n'
    for (let i = 0; i < distributors.length; i++) {
        const username = (await contract.methods.users(distributors[i].distributor).call()).username
        articles += `
            <article>
            <div class="grid">
                <div>
                    <b>${username}</b>
                    <br>
                    ${distributors[i].server}
                    <br>
                    ${distributors[i].distributor}
                </div>
                <div class="card">
                    <h4>${distributors[i].fee} wei</h4>
                </div>
            </div>
        </article>
        `
    }
    document.getElementById("distributors").innerHTML = articles
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