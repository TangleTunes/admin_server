#!/bin/bash

# Go to wallet directory
cd /app/wallet

if [ $# -lt 2 ]; then
    echo "Wrong arguments: ./ttdistributor <chain_id> <contract_addr>" 1>&2
    exit 69
fi

# Check first argument is a valid chain id
CHAIN="$1"
if [[ ! ($CHAIN =~ ^tst1[a-z0-9]{59}$) ]]
then 
    echo "Wrong argument: invalid chain id" 1>&2
    exit 69
fi

# Check second argument is a valid contract address
CONTRACT="$2"
if [[ ! ($CONTRACT =~ ^0x[a-fA-F0-9]{40}$) ]]
then 
    echo "Wrong argument: invalid eth address" 1>&2
    exit 69
fi

# Generate toml file
echo "Generating toml file"
echo "server_address = \"`dig +short txt ch whoami.cloudflare @1.0.0.1 | sed 's/"//g'`:3000\"" > TangleTunes.toml
echo "bind_address = \"0.0.0.0:3000\"" >> TangleTunes.toml
echo "database_path = \"./database\"" >> TangleTunes.toml
echo "fee = 1" >> TangleTunes.toml
echo "node_url = \"http://wasp:9090/chains/${CHAIN}/evm\"" >> TangleTunes.toml
echo "chain_id = 1074" >> TangleTunes.toml
echo "contract_address = \"${CONTRACT}\"" >> TangleTunes.toml

# Generate wallet address
if ! ttdistributor wallet address &> /dev/null
then
    echo "Generating wallet address"
    ttdistributor wallet generate --plaintext
    bash /app/scripts/request-funds.sh `ttdistributor wallet address | cut -d" " -f 3`
    ttdistributor account create --name "Validator-Distributor"
fi
