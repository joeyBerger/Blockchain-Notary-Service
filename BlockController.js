const BlockClass = require('./Block.js');
const Blockchain = require('./simpleChain.js')
const Mempool = require('./Mempool.js')

/* ===== BlockController Class ======================
|  Class with a constructor for controller		    |
|  ================================================*/
class BlockController {

    constructor(server) {
        this.server = server;
        this.requestValidation();
        this.validateMessageSignature();
        this.submitStarData();
        this.getBlockByIndex();
        this.getBlockByHash();
        this.getBlockByWalletAddress();
        //create blockchain instance
        this.blockchain = new Blockchain.Blockchain();
        //create mempool instance
        this.mempool = new Mempool.Mempool();
    }

    //initial request for validation
    requestValidation() {
        this.server.route({
            method: 'POST',
            path: '/requestValidation',
            handler: async (request, h) => {
                const result = await this.mempool.makeInitialValidation(request.payload);
                return result;  
            }
        });
    }

    //post with signature 
    validateMessageSignature() {
        this.server.route({
            method: 'POST',
            path: '/message-signature/validate',
            handler: async (request, h) => {
                const result = await this.mempool.validateRequestByWallet(request.payload);
                return result;  
            }
        });
    }

    //post star data and store results to blockchain, return new block object
    submitStarData() {
        this.server.route({
            method: 'POST',
            path: '/block',
            handler: async (request, h) => {
                const result = await this.mempool.verifyAddressRequest(request.payload);
                if (result.address !== undefined) {
                    //add block to blockchain
                    let blockResult = await this.blockchain.addBlock(new BlockClass.Block(result));
                    return await this.blockchain.addDecodedStoryToReturnObj(blockResult);                    
                }
                return result;  
            }
        });
    }

    //retrieve stored block by user defined block height
    getBlockByIndex() {
        this.server.route({
            method: 'GET',
            path: '/block/{index}',
            handler: async (request, h) => {
                let blockIndex = parseInt(request.params.index);
                const result = await this.blockchain.getBlock(blockIndex);
                return result.statusCode !== undefined ? result : await this.blockchain.addDecodedStoryToReturnObj(JSON.stringify(result).toString());
            }
        });
    }

    //retrieve stored block by user defined block hash
    getBlockByHash() {
        this.server.route({
            method: 'GET',
            path: '/stars/hash:{hashIndex}',
            handler: async (request, h) => {                
                let hashIndex = request.params.hashIndex;
                const result = await this.blockchain.getBlockByHash(hashIndex);         
                return result.statusCode !== undefined ? result : await this.blockchain.addDecodedStoryToReturnObj(result);
            }
        });
    }

    //retrieve stored block by user defined wallet address 
    getBlockByWalletAddress() {
        this.server.route({
            method: 'GET',
            path: '/stars/address:{addressIndex}',
            handler: async (request, h) => {                
                let addressIndex = request.params.addressIndex;
                const result = await this.blockchain.getBlockByWalletAddress(addressIndex);
                if (result.length > 0) {
                    let finalBlocks = [];
                    for (var i = 0; i < result.length; i++)
                    {
                        finalBlocks.push(await this.blockchain.addDecodedStoryToReturnObj(result[i]));
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