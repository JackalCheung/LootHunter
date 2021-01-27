# LootHunter
A Turn-based Strategy game built with Blockchain technology 
Platforms: All platforms that support internet browser with browser extension
Languages: HTML (Phaser 3), JavaScript (React.js/Node.js), Solidity

A turn-based strategy game that provides single and multi-player experience with the unique blockchain collectibles earned in the game. Players take turns to move their chess on the field and the final objective is to eliminate their enemy. Those blockchain collectibles are ERC-721 non-fungible tokens which are tradeable and unique even the attributes of the weapons or armors are the same.

Installation instruction
1.	Install node.js
2.	Install Ganache (https://www.trufflesuite.com/ganache)
3.	Install Metamask at default browser (Recommend: Google Chrome, Firefox)
4.	Start Ganache and create new workspace
5.	Config the truffle-config.js to Ganache Network (Should be the same as I used default case)
6.	Open cmd
7.	cd to project directory
8.	Input truffle compile
9.	Input truffle migrate --network ganache
10.	Input truffle migrate --network ganache --reset --compile-all
11.	Copy and replace all the files from /build to /client/src/contracts
12.	Open Metamask and create new network through setting -> new network, enter the RPC URL from Ganache to the New RPC URL in Metamask
13.	Import Ethereum address in Metamask with the private keys in Ganache
14.	cd /client in cmd
15. Input npm install to install all dependencies
16.	Input npm run start
17.	Open new cmd
18.	cd to project directory/server
19.	Input node server.js (For multiplayer)
20. Test on browser

If it does not work, please download at https://drive.google.com/drive/folders/1QnMYqajFRHNqTC2knlA-TV-FckTUgtpw?usp=sharing and try again
