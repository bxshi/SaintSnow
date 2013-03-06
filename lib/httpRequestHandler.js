/**
 * Created with JetBrains WebStorm.
 * User: Baoxu Shi
 * Date: 13-3-5
 * Time: PM2:08
 * To change this template use File | Settings | File Templates.
 */

var util = require('util');
var http = require('http');
var async = require('async');
var EventEmitter = require('events').EventEmitter;

const START = 1;
const STOP = 2;
const PAUSE = 3;

var httpRequestHandler = function(){
    EventEmitter.call(this);

    this.on('next', urlFetcher);


    this.success=0;
    this.err=0;

    this.status = STOP;
};
util.inherits(httpRequestHandler, EventEmitter);

var p = httpRequestHandler.prototype;

p.setOptionList = function(optionList){
    this.optionList = optionList;
    this.optionLen = optionList.length;
};

p.setMaxDelay = function(maxDelay){
    this.maxDelay = maxDelay == null ? 0 : maxDelay;
};

p.getFetchStatus = function(){
    return {'success' : this.success, 'error' : this.err};
};

var urlFetcher = function(self){
    try{
        if(self.status == START){
            var randomURL = Math.floor(self.optionLen * Math.random());
            var req = http.request(self.optionList[randomURL].options,
                function(res){
                    res.on('end', function(){
                        delete res.chunk;
                        self.success++;
                        setTimeout(function(){
                            self.emit('next', self);
                        }, Math.floor(self.maxDelay * Math.random()));
                    });
                });
            if(self.optionList[randomURL].data){
                req.end(self.optionList[randomURL].data);
            }
            req.end();
            req.on('error', function(){
                self.error++;
                self.emit('next', self);
            });
        }
    }catch(err){
        console.log(err, err.stack);
        self.err++;
        setTimeout(function(){
            self.emit('next', self);
        }, Math.floor(self.maxDelay * Math.random()));
    }

};

p.start = function(){
    if(this.status == START){
        throw new Error('httpRequestHandler has already started');
    }else if(this.optionList==null || this.optionLen==null || this.maxDelay==null){
        throw new Error('httpRequestHandler needs initialize before doing actual work');
    }else{
        util.debug('start handler');
        this.status = START;
        this.emit('next', this);
    }
};

p.stop = function(){
    this.status = STOP;
};




module.exports = httpRequestHandler;
