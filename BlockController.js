const BlockClass = require('./Block.js');
const Blockchain = require('./simpleChain.js')
const Mempool = require('./Mempool.js')
var bitcoin = require('bitcoinjs-lib') // v3.x.x
var bitcoinMessage = require('bitcoinjs-message')
const hex2ascii = require('hex2ascii')

/* ===== BlockController Class ======================
|  Class with a constructor for controller		    |
|  ================================================*/
class BlockController {

    constructor(server) {
        this.server = server;
        this.blocks = [];
        this.getBlockByIndex();
        this.postNewBlock();
        this.requestValidation();
        this.validateMessageSignature();
        this.submitStarData();
        this.getBlockByHash();
        this.getBlockByWalletAddress();
        this.myBlockChain = new Blockchain.Blockchain();

        //temp
        this.mempool = new Mempool.Mempool();
    }

    //Retrieve stored block by user defined block height
    getBlockByIndex() {
        this.server.route({
            method: 'GET',
            path: '/block/{index}',
            handler: async (request, h) => {
                let blockIndex = (parseInt(request.params.index));
                const result = await this.myBlockChain.getBlock(blockIndex);         
                const finalResult = await this.myBlockChain.addDecodedStoryToReturnObj(result)
                return finalResult;
            }
        });
    }

    //Post new block with user defined body
    //If payload is null or does not contain a valid string for 'body', reject post request and display error message
    postNewBlock() {
        this.server.route({
            method: 'POST',
            path: '/block',
            handler: async (request, h) => {
                //check for valid body
                if (request.payload !== null && request.payload.body !== undefined && request.payload.body !== "")
                {
                    const result = await this.myBlockChain.addBlock(new BlockClass.Block(request.payload.body));                    
                    return result;                                   
                }
                //return message in case of invalid body
                return "An Entry For 'Body' Is Necessary To Create New Block";
            }
        });
    }

    requestValidation() {
        this.server.route({
            method: 'POST',
            path: '/api/requestValidation',
            handler: async (request, h) => {
                //const result = await this.mempool.waitForTimeoutRequestsWindowTime(request.payload);
                //const result = await this.mempool.testDelay();
                const result = await this.mempool.makeInitialValidation(request.payload);
                return result;  
            }
        });
    }

    validateMessageSignature() {
        this.server.route({
            method: 'POST',
            path: '/api/message-signature/validate',
            handler: async (request, h) => {
                const result = await this.mempool.validateRequestByWallet(request.payload);
                return result;  
            }
        });
    }

    submitStarData() {
        this.server.route({
            method: 'POST',
            path: '/api/submitStarData',
            handler: async (request, h) => {
                const result = await this.mempool.verifyAddressRequest(request.payload);
                if (result.address !== undefined) {
                    let blockResult = await this.myBlockChain.addBlock(new BlockClass.Block(result));
                    let finalResult = await this.myBlockChain.addDecodedStoryToReturnObj(blockResult);
                    return finalResult;
                }
                return result;  
            }
        });
    }

    getBlockByHash() {
        this.server.route({
            method: 'GET',
            path: '/stars/hash:{hashIndex}',
            handler: async (request, h) => {                
                let hashIndex = ((request.params.hashIndex));
                console.log("hashIndex",hashIndex);
                const result = await this.myBlockChain.getBlockByHash(hashIndex);         
                let finalResult = await this.myBlockChain.addDecodedStoryToReturnObj(result);
                return finalResult;
            }
        });
    }

    getBlockByWalletAddress() {
        this.server.route({
            method: 'GET',
            path: '/stars/address:{addressIndex}',
            handler: async (request, h) => {                
                let addressIndex = ((request.params.addressIndex));
                console.log("addressIndex",addressIndex);
                const result = await this.myBlockChain.getBlockByWalletAddress(addressIndex);     
                let finalResult = [];
                for (var i = 0; i < result.length; i++)
                {
                    finalResult.push(await this.myBlockChain.addDecodedStoryToReturnObj(result[i]));
                }    
                //let finalResult = await this.myBlockChain.addDecodedStoryToReturnObj(result);
                //return finalResult;
                return finalResult;
            }
        });
    }
}

//Exporting the BlockController class
module.exports = (server) => { return new BlockController(server);}