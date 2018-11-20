const TimeoutRequestsWindowTime = 5*60*1000 // 5*60*1000;  //1000
const TimeoutMempoolValidWindowTime = 30*60*1000;

class Mempool {
    constructor(){
       this.mempool = [];
       this.timeoutRequests = [];
       this.mempoolValid = [];
       this.timeoutMempoolValid = [];

       //this.mempoolTimeStamp = [];   //probably rename this to this.mempool
   }

   removeValidationRequest(iwalletAddress) {
        this.timeoutRequests[iwalletAddress] = undefined;
        console.log("in removeValidationRequest");
   }

   returnInitialValidationObj(iwalletAddress) {
        let requestTimeStamp = new Date().getTime().toString().slice(0, -3);
        requestTimeStamp = "1542589853";
        let message = iwalletAddress.toString() + ":" + requestTimeStamp + ":" + "starRegistry";
        let validationWindow = TimeoutRequestsWindowTime/1000;
        var mempoolObj = {
            requestTimeStamp: new Date().getTime().toString().slice(0, -3),
            message: message
        }
        this.mempool[iwalletAddress] = mempoolObj;
        let returnObj = {
            walletAddress: iwalletAddress,
            requestTimeStamp: requestTimeStamp,
            message: message,
            validationWindow: validationWindow
        }
        return returnObj;
    }

    makeInitialValidation(request) {
        if (this.timeoutRequests[request.address] !== undefined) {
            let timeElapse = (new Date().getTime().toString().slice(0,-3)) - this.mempool[request.address].requestTimeStamp;
            let timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
            let returnObj = {
                address: request.address,
                timeRemaining: timeLeft,
                instruction: "Please do the thing you need to do"
            }
            return returnObj;
        }
        else{
            let self = this;            
            return new Promise(function(resolve, reject) {
                self.timeoutRequests[request.address]=setTimeout(function(){ self.removeValidationRequest(request.address) }, TimeoutRequestsWindowTime );  //you have no catch
                resolve(self.returnInitialValidationObj(request.address));
            })
        }
    }

    validateRequestByWallet(request) {        
        //if ((new Date().getTime().toString().slice(0,-3)) - req.requestTimeStamp > 0)     
        console.log("request time stamp", this.mempool[request.address].message);   
        if (parseInt(this.mempool[request.address].requestTimeStamp) > 0) {
            //console.log("greater than 0");
        }
        const bitcoinMessage = require('bitcoinjs-message'); 
        let isValid = bitcoinMessage.verify(this.mempool[request.address].message, request.address, request.signature);        
        if (this.timeoutRequests[request.address] === undefined) {
            var errObj = {
                error: "Request Has Timed Out"
            };
            return errObj;
        }
        if (isValid === true) {
            this.timeoutRequests[request.address] = undefined;
            return this.createNewValidMempool(request.address, request.signature, this.mempool[request.address].message, "validation window", true);
        }
        var errObj = {
            error: "Unable to verify message"
        };
        return errObj;
    }

    createNewValidMempool(iwalletAddress,irequestTimeStamp,imessage,ivalidationWindow,ivalid) {
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
        if (this.mempoolValid[request.address] !== undefined && this.mempoolValid[request.address].status.messageSignature === true) {
            return this.encodeStarStoryData(request);
        }
        var errObj = {
            error: "Unable to verify address"
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



    testDelay() {
        let self = this;
        return new Promise(function(resolve, reject) {
        let somtething = setTimeout(function(){ resolve(self.secondDelayFunc()) }, TimeoutRequestsWindowTime );
        })
    }

    secondDelayFunc() {
        console.log("secondDelayFunc");
        let obj = {address: "asdasfadsfadsf"}
        return (obj)
    }
}

module.exports.Mempool = Mempool;