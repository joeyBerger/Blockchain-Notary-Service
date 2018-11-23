# Blockchain Notary Service
This web application manages a Star Registry Service via a blockchain service.

## Prerequisites
Access to a operating system capable of sending GET and POST requests.

## Installing
* Unzip project or clone from [Github](https://github.com/joeyBerger/Blockchain-Notary-Service)
* •	Dependencies needed for this project can be found here:
    * [bitcoinjs-lib: ^4.0.2](https://github.com/bitcoinjs/bitcoinjs-lib)
    * [bitcoinjs-message: ^2.0.0](https://github.com/bitcoinjs/bitcoinjs-message/blob/master/README.md  )	
    * [body-parser: ^1.18.3](://www.npmjs.com/package/body-parser)
    * [crypto-js: ^3.1.9-1](https://github.com/brix/crypto-js)
    * [hapi: ^17.8.1](https://hapijs.com)   
    * [hex2ascii: 0.0.3](https://www.npmjs.com/package/hex2ascii)
    * [level: ^4.0.0](https://github.com/Level/level)   
* Navigate to folder and in a terminal enter `node app.js`

#### Running the web application
#####  Posting a new block
* Once the application is running within your local environment, request an initial validation by posting a valid address at `localhost:8000/requestValidation`. The server will return the same address, the requested time stamp, a generated message and a validation window in JSON format. If another request is made to this URL with a previously requested address, the same JSON object will be returned, but with an updated validation window time.
* The user will take the previously returned message and the initial address, and will generate a signature. The user will package the address and the signature, and post a validation request at `localhost:8000/message-signature/validate`.
* The server will validate the signature using `bitcoinMessage.verify` and will store the request for another validation period. The server will return a status with the address, requested time stamp, message, newly created validation window, and message signature status in JSON format.
* Lastly the user will post a new star to the blockchain by packaging its address and star data in a JSON object to `http://localhost:8000/block`. Once the block has been successfully created, the block is returned to the user. The decoded hexadecimal story is also returned to the user as part of this package.  
##### Viewing posted blocks
* Users can view a block by submitting the hash value at `http://localhost:8000/stars/hash:{hashBalue}`. If the hash is valid, the server will return the associated block.
* Users can view one or more blocks by submitting a wallet address at `http://localhost:8000/stars/address:{address}`. The server will return all blocks associated with the submitted address.
* Users can view a block by submitting a block index at`http://localhost:8000/block/{blockIndex}`. If the block index is valid, the server will return the associated block.

#### Built With
* Node.js
* Hapi.js

#### Authors
Joey Berger

 