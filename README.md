# RESTful API Project
This web application manages, displays, and writes persistent blockchain data. 

## Prerequisites
Access to a operating system capable of sending GET and POST requests.

## Installing
* Unzip project or clone from [Github](https://github.com/joeyBerger/RESTful-Api-Blockchain)
* Navigate to folder and in a terminal enter `node app.js`

#### Running the web application
* Once the application is running within your local environment, visit `localhost:8000/block/0` to view the first block
* The first 10 blocks in this blockchain have been pre-generated. Feel free to inspect this data by requesting a GET with a specific block height at `localhost:8000/block/{a block height}`
* If a block height is requested that does not exsist on the blockchain, a string formatted error message is returned.
* Posting a new block can be done by posting a data payload that contains a member 'body' with valid text. 
* The POST address is `localhost:8000/block`
* A new block will be generated on the blockcain and the newly generated block will be returned in JSON format.
* If the posted data payload is not in an acceptable format, a string formatted error message is returned.

#### Built With
* Node.js
* Hapi.js

#### Authors
Joey Berger