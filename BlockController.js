const BlockClass = require('./Block.js');
const Blockchain = require('./simpleChain.js')
var bitcoin = require('bitcoinjs-lib') // v3.x.x
var bitcoinMessage = require('bitcoinjs-message')

/* ===== BlockController Class ======================
|  Class with a constructor for controller		    |
|  ================================================*/
class BlockController {

    constructor(server) {
        this.server = server;
        this.blocks = [];
        this.getBlockByIndex();
        this.postNewBlock();
        this.myBlockChain = new Blockchain.Blockchain();
    }

    //Retrieve stored block by user defined block height
    getBlockByIndex() {
        this.server.route({
            method: 'GET',
            path: '/block/{index}',
            handler: async (request, h) => {
                let blockIndex = (parseInt(request.params.index));
                const result = await this.myBlockChain.getBlock(blockIndex);         
                return result;
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
}

//Exporting the BlockController class
module.exports = (server) => { return new BlockController(server);}