const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii')

// Importing the module 'level'
const level = require('level');

// Declaring the folder path that store the data
const chainDB = './chaindata';
const db = level(chainDB);

// Declaring folder path that contains the Block class
const Block = require('./Block.js');

// General error message
const missingBlockErrorObj = {
    statusCode: "404",
    referenceId: "0001",
    mesage: "Requested Block Does Not Exist"
};

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/
class Blockchain {
    constructor() {
        let self = this;
        this.getBlockHeight().then(function(result) {
            //chain is empty if result is 0, therefore add genesis block
            if (result === -1) {
                self.addBlock(new Block.Block("First block in the chain - Genesis block"));
            }
        })
    }

    //add new block
    addBlock(newBlock) {
        let self = this;
        return new Promise(function(resolve, reject) {
            self.getBlockHeight().then(function(result) {
                newBlock.height = result + 1;
                //get previous block for previousHash                
                return self.getBlock(result);
            }).then(function(result) {
                //don't assign previousHash if genesis block
                if (result !== 0) {
                    newBlock.previousBlockHash = result.hash;
                }
                //get current time
                newBlock.time = new Date().getTime().toString().slice(0, -3);
                //make hash of object
                newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
                //make string of object to write to database
                let stringifiedObj = JSON.stringify(newBlock).toString();
                db.put(newBlock.height, stringifiedObj, function(err) {
                    if (err) {
                        console.log('Block ' + newBlock.height + ' submission failed', err);
                        reject(err);
                    }
                })
                resolve(stringifiedObj);
            }).catch(() => {
                console.log("Unable To Add Block");
            })
        })
    }

    //get block height
    getBlockHeight() {
        let self = this;
        return new Promise(function(resolve, reject) {
            let i = -1;
            db.createReadStream().on('data', function() {
                i++;
            }).on('error', function(err) {
                console.log('Unable to read data stream!', err);
                reject(err);
            }).on('close', function() {
                self.getBlock(i).then(function(result) {
                    if (result === 0) {
                        resolve(-1);
                    } else {
                        resolve(result.height);
                    }
                })
            });
        });
    }

    //get block
    getBlock(blockHeight) {
        return new Promise(function(resolve, reject) {
            //only search db if not genesis block
            if (blockHeight > -1) {
                db.get(blockHeight, function(err, value) {
                    if (err) {
                        resolve(missingBlockErrorObj);
                    } else {
                        resolve(JSON.parse(value));
                    }
                })
            } else {
                resolve(0);
            }
        });
    };

    //validate block
    validateBlock(blockHeight) {
        let self = this;
        return new Promise(function(resolve) {
            self.getBlock(blockHeight).then(function(result) {
                let block = result;
                let blockHash = block.hash;
                block.hash = '';
                let validBlockHash = SHA256(JSON.stringify(block)).toString();
                // Compare
                if (blockHash === validBlockHash) {
                    resolve(true);
                } else {
                    resolve('Block #' + blockHeight + ' invalid hash:\n' + blockHash + '<>' + validBlockHash);
                }
            })
        })
    }

    //validate blockchain
    validateChain() {
        let self = this;
        let validateBlockErrorLog = [];
        let internalErrorLog = [];
        return new Promise(function(resolve) {
            self.getBlockHeight().then(function(result) {
                var totalBlocks = result;
                let promises = [];
                let blockObj = [];
                for (var i = 0; i < totalBlocks + 1; i++) {
                    promises.push(self.validateBlock(i));
                }
                for (var i = 0; i < totalBlocks + 1; i++) {
                    blockObj.push(self.getBlock(i));
                }
                Promise.all(promises).then(function(results) {
                    for (var i = 0; i < results.length; i++) {
                        if (results[i] !== true) {
                            validateBlockErrorLog.push(results[i]);
                        }
                    }
                    if (validateBlockErrorLog.length > 0) {
                        console.log(validateBlockErrorLog.length + " Error(s) Detected");
                        for (var i = 0; i < validateBlockErrorLog.length; i++) {
                            console.log(validateBlockErrorLog[i]);
                        }
                    }
                    Promise.all(blockObj).then(function(results) {
                        for (var i = 0; i < results.length - 1; i++) {
                            let blockHash = results[i].hash;
                            let previousHash = results[i + 1].previousBlockHash;
                            if (blockHash !== previousHash) {
                                internalErrorLog.push("Previous Block Hash Of Block " + (i + 1) + " Does Not Match Hash Of Previous Block");
                            }
                        }
                        if (internalErrorLog.length > 0) {
                            for (var i = 0; i < internalErrorLog.length; i++) {
                                console.log(internalErrorLog[i]);
                            }
                        } else if (internalErrorLog.length === 0) {
                            console.log('No errors detected');
                        }
                        resolve();
                    });
                });
            })
        })
    }

    //get block by hash
    getBlockByHash(hash) {
        let block = null;
        return new Promise(function(resolve, reject) {
            db.createReadStream()
                .on('data', function(data) {
                    if (JSON.parse((data.value)).hash === hash) {
                        block = data.value;
                        resolve(block);
                    }
                })
                .on('error', function(err) {
                    reject(err)
                })
                .on('close', function() {
                    if (block === null) {
                        resolve(missingBlockErrorObj);
                    }
                    resolve(block);
                });
        });
    }

    //decode story from hexadecimal and add to requested return object
    addDecodedStoryToReturnObj(obj) {
        return new Promise(function(resolve) {
            let jsonResult = JSON.parse((obj))
            if (jsonResult.body.star !== undefined) {
                jsonResult.body.star.storyDecoded = hex2ascii(jsonResult.body.star.story)
            }
            resolve(jsonResult);
        })
    }

    //get all relevent blocks based on submited wallet address, will return an arrow of objects
    getBlockByWalletAddress(address) {
        let block = [];
        return new Promise(function(resolve, reject) {
            db.createReadStream()
                .on('data', function(data) {
                    if (JSON.parse(data.value).body.address !== undefined && JSON.parse(data.value).body.address === address) {
                        block.push(data.value);
                    }
                })
                .on('error', function(err) {
                    reject(err)
                })
                .on('close', function() {
                    if (block.length === 0) {
                        resolve(missingBlockErrorObj);
                    }
                    resolve(block);
                });
        })
    }
}

module.exports.Blockchain = Blockchain;