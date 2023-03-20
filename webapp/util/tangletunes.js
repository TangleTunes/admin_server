const { ethers } = require('ethers');
const fs = require('fs');

function get_contract() {
    const provider = new ethers.JsonRpcProvider(`http://wasp:9090/chains/${process.env.CHAIN_ID}/evm`, 1074)
    const abi = JSON.parse(fs.readFileSync('/app/static/abi.json'))

    return new ethers.Contract(process.env.CONTRACT, abi, provider);
}

const get_user = async (address) => await get_contract().users(address)

const get_song_id = (name, author) => ethers.solidityPackedKeccak256(["string", "address"], [name, author])

module.exports = {
    get_user,
    get_song_id
};