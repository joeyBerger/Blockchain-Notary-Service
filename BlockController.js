const BlockClass = require('./Block.js');
const Blockchain = require('./simpleChain.js')
const Mempool = require('./Mempool.js')

/* ===== BlockController Class ======================
|  Class with a constructor for controller		    |
|  ================================================*/
class BlockController {

    constructor(server) {
        this.server = server;
        this.blocks = [];
        this.getBlockByIndex();
        this.requestValidation();
        this.validateMessageSignature();
        this.submitStarData();
        this.getBlockByHash();
        this.getBlockByWalletAddress();
        this.myBlockChain = new Blockchain.Blockchain();
        this.mempool = new Mempool.Mempool();
    }
    requestValidation() {
        this.server.route({
            method: 'POST',
            path: '/api/requestValidation',
            handler: async (request, h) => {
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

    submitStarData() {  //change name
        this.server.route({
            method: 'POST',
            path: '/api/submitStarData',
            handler: async (request, h) => {
                const result = await this.mempool.verifyAddressRequest(request.payload);
                if (result.address !== undefined) {
                    //add block to blockchain
                    let blockResult = await this.myBlockChain.addBlock(new BlockClass.Block(result));
                    return await this.myBlockChain.addDecodedStoryToReturnObj(blockResult);                    
                }
                return result;  
            }
        });
    }

    //Retrieve stored block by user defined block height
    getBlockByIndex() {
        this.server.route({
            method: 'GET',
            path: '/block/{index}',
            handler: async (request, h) => {
                let blockIndex = parseInt(request.params.index);
                const result = await this.myBlockChain.getBlock(blockIndex);
                return result.Error !== undefined ? result : await this.myBlockChain.addDecodedStoryToReturnObj(result);
            }
        });
    }

    //Retrieve stored block by user defined block hash
    getBlockByHash() {
        this.server.route({
            method: 'GET',
            path: '/stars/hash:{hashIndex}',
            handler: async (request, h) => {                
                let hashIndex = request.params.hashIndex;
                const result = await this.myBlockChain.getBlockByHash(hashIndex);         
                return result.Error !== undefined ? result : await this.myBlockChain.addDecodedStoryToReturnObj(result);
            }
        });
    }

    //Retrieve stored block by user defined wallet address 
    getBlockByWalletAddress() {
        this.server.route({
            method: 'GET',
            path: '/stars/address:{addressIndex}',
            handler: async (request, h) => {                
                let addressIndex = request.params.addressIndex;
                const result = await this.myBlockChain.getBlockByWalletAddress(addressIndex);
                if (result.length > 0) {
                    let finalBlocks = [];
                    for (var i = 0; i < result.length; i++)
                    {
                        finalBlocks.push(await this.myBlockChain.addDecodedStoryToReturnObj(result[i]));
                    }    
                    return finalBlocks;
                } 
                return result;
            }
        });
    }
}

//Exporting the BlockController class
module.exports = (server) => { return new BlockController(server);}