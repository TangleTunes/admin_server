#!/bin/bash

# Go to wallet directory
cd /app/wallet

# Initialize wallet
if ! wasp-cli address &> /dev/null
then
    echo "Initializing wallet"
    wasp-cli init
    wasp-cli set l1.apiaddress http://hornet-nest:14265
    wasp-cli set l1.faucetaddress http://hornet-nest:8091
    wasp-cli wasp add 0 http://wasp:9090
fi

# Deploy chain
if ! wasp-cli chain info --chain=tangletunes &> /dev/null
then
    echo "Deploying tangletunes chain"
    wasp-cli request-funds
    wasp-cli chain deploy --quorum=1 --chain=tangletunes --description="TangleTunes"
fi