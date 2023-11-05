A website for the TangleTunes p2p music streaming service which allows new content to be uploaded to the platform.

## Deploying Infrastructure
The IOTA tangle and L2 chain can be deployed running the following command
```
docker compose up
```

More information about the chain deployed can be found in the wasp node dashboard at http://localhost:7000 or in the debug section of the website at http://localhost/debug/info. The smart contract must be deployed on the chain for the website to work and the source code in [index.js](./webapp/index.js) must include the correct contract address.

Once the smart contract has been deployed the website must be restarted using the following commands:
1. Remove the current distributor information 
```
docker compose exec -it validator bash
# rm wallet/TangleTunes.toml wallet/database
```
2. Rebuild and deploy the website container
```
 docker compose build validator --no-cache && docker compose up validator -d
```

## License
The code in this repository is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
