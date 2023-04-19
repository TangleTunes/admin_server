#!/bin/bash

# Go to wallet directory
cd /app/wallet

# Get Linux kernel architecture
if uname -a | grep "x86_64"
then
    ARCH="x86_64"
    TTDIST="x86_64-unknown-linux-gnu"
else
    ARCH="ARM64"
    TTDIST="aarch64-unknown-linux-gnu"
fi

# Install wasp's command line wallet
if ! command -v wasp-cli &> /dev/null
then
    WASPCLI="wasp-cli_0.5.0-alpha.6_Linux_${ARCH}"
    echo "Installing wasp-cli"
    wget "https://github.com/iotaledger/wasp/releases/download/v0.5.0-alpha.6/${WASPCLI}.tar.gz"
    tar -xzvf "${WASPCLI}.tar.gz"
    mv "${WASPCLI}/wasp-cli" /usr/bin
    rm -r "${WASPCLI}" "${WASPCLI}.tar.gz"
fi

# Install Tangle Tunes distributor's binary
if ! command -v ttdistributor &> /dev/null
then
    echo "Installing ttdistributor"
    wget "https://github.com/TangleTunes/distributing_client/releases/download/v0.1.1/tangle-tunes-distributor-${TTDIST}.tar.gz"
    tar -xzvf "tangle-tunes-distributor-${TTDIST}.tar.gz"
    mv ./tangle-tunes-distributor /usr/bin/ttdistributor
    rm "tangle-tunes-distributor-${TTDIST}.tar.gz"
fi

# Install Tangle Tunes mobile app's apk
echo "Installing apk"
wget "https://github.com/TangleTunes/listener/releases/download/v0.0.21/app-release.apk" -O /app/static/mobile/tangletunes.apk

# Install dig
if ! command -v dig &> /dev/null
then
    echo "Installing dig"
    apt update -y && apt install dnsutils -y
fi

