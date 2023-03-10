async function get_provider() {
    if (window.ethereum) {
        await window.ethereum.request({method: 'eth_requestAccounts'});
        window.web3 = new Web3(window.ethereum)
    }
}

if (!window.web3) {
    get_provider()
}