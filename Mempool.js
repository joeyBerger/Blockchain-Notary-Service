const TimeoutRequestsWindowTime = 5 * 60 * 1000;
const TimeoutMempoolValidWindowTime = 30 * 60 * 1000;

/* ===== Mempool Class =============================
|  Class with a constructor for the mempool		|
|  ================================================*/
class Mempool {
    constructor() {
        this.mempool = [];
        this.timeoutRequests = [];
        this.mempoolValid = [];
    }

    makeInitialValidation(request) {
        if (this.timeoutRequests[request.address] !== undefined) {
            //return validation request already stored in mempool
            let message = this.mempool[request.address].message;
            let requestTimeStamp = this.mempool[request.address].requestTimeStamp;
            //calculate validation time remaining
            let timeElapse = (new Date().getTime().toString().slice(0, -3)) - this.mempool[request.address].requestTimeStamp;
            let timeRemaining = (TimeoutRequestsWindowTime / 1000) - timeElapse;
            let returnObj = {
                walletAddress: request.address,
                requestTimeStamp: requestTimeStamp,
                message: message,
                validationWindow: timeRemaining,
            }
            return returnObj;
        } else {
            let self = this;
            return new Promise(function(resolve, reject) {
                //store timeout function in timeoutRequests to end initial validation request
                self.timeoutRequests[request.address] = setTimeout(function() {
                    self.removeValidationRequest(request.address)
                }, TimeoutRequestsWindowTime);
                resolve(self.returnValidationObjOnInitialRequest(request.address));
            })
        }
    }

    removeValidationRequest(iwalletAddress) {
        this.timeoutRequests[iwalletAddress] = undefined;
    }

    returnValidationObjOnInitialRequest(iwalletAddress) {
        //get current time
        let requestTimeStamp = new Date().getTime().toString().slice(0, -3);
        // requestTimeStamp = "1542589853"; //temp!!!
        //generate message string
        let message = iwalletAddress.toString() + ":" + requestTimeStamp + ":" + "starRegistry";
        //generate validation window to display in seconds
        let validationWindow = TimeoutRequestsWindowTime / 1000;
        //generate object to store critical data
        var mempoolObj = {
            requestTimeStamp: new Date().getTime().toString().slice(0, -3),
            message: message
        }
        //store critical data in mempool array
        this.mempool[iwalletAddress] = mempoolObj;
        let returnObj = {
            walletAddress: iwalletAddress,
            requestTimeStamp: requestTimeStamp,
            message: message,
            validationWindow: validationWindow
        }
        return returnObj;
    }

    validateRequestByWallet(request) {
        //if timeoutRequests' set timeout function is undefined, then validation must have timed out and return error object
        if (this.timeoutRequests[request.address] === undefined) {
            var errObj = {
                statusCode: "408",
                referenceId: "0002",
                message: "Validation Request Has Timed Out"
            };
            return errObj;
        }
        //check to see if message, signature and address are valid
        const bitcoinMessage = require('bitcoinjs-message');
        let isValid = bitcoinMessage.verify(this.mempool[request.address].message, request.address, request.signature);
        if (isValid === true) {
            this.timeoutRequests[request.address] = undefined;
            this.timeoutRequests[request.address] = setTimeout(function() {
                this.removeValidationRequest(request.address)
            }, TimeoutMempoolValidWindowTime);
            return this.createNewValidMempool(request.address, request.signature, this.mempool[request.address].message, TimeoutMempoolValidWindowTime/1000, true);
        }
        var errObj = {
            statusCode: "403",
            referenceId: "0003",
            message: "Unable To Verify Message"
        };
        return errObj;
    }

    createNewValidMempool(iwalletAddress, irequestTimeStamp, imessage, ivalidationWindow, ivalid) {
        this.registerStar = true;
        this.status = {
            address: iwalletAddress,
            requestTimeStamp: irequestTimeStamp,
            message: imessage,
            validationWindow: ivalidationWindow,
            messageSignature: ivalid
        }
        var newValidMempool = {
            registerStar: this.registerStar,
            status: this.status
        }
        this.mempoolValid[iwalletAddress] = newValidMempool;
        return newValidMempool;
    }

    verifyAddressRequest(request) {
        //check for story > 250 words
        if (request.star.story.split(' ').length > 250) {
            var errObj = {
                statusCode: "413",
                referenceId: "0004",
                message: "Star Story Cannot Have More Than 250 Words"
            };
            return errObj;
        }
        //if messagae signature is valid, return object with encoded star story 
        if (this.mempoolValid[request.address] !== undefined && this.mempoolValid[request.address].status.messageSignature === true) {
            return this.encodeStarStoryData(request);
        }
        var errObj = {
            statusCode: "403",
            referenceId: "0005",
            message: "Unable To Verify Address"
        };
        return errObj;
    }

    encodeStarStoryData(request) {        
        let body = {
            address: request.address,
            star: {
                ra: request.star.ra,
                dec: request.star.dec,
                mag: request.star.mag,
                cen: request.star.cen,
                story: Buffer(request.star.story).toString('hex')
            }
        };
        return body;
    }
}

module.exports.Mempool = Mempool;