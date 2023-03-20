const { ethers } = require('ethers');
const fs = require('fs');

function get_contract(app) {
    const provider = new ethers.JsonRpcProvider(`http://wasp:9090/chains/${app.get('CHAIN_ID')}/evm`, 1074)
    const abi = JSON.parse(fs.readFileSync('/app/static/abi.json'))

    return new ethers.Contract(app.get('contract'), abi, provider);
}

const get_user = async (user, app) => await get_contract(app).users(user)

const get_song_id = (name, author) => ethers.solidityPackedKeccak256(["string", "address"], [name, author])

module.exports = {
    get_user,
    get_song_id
};