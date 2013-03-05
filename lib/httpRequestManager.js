/**
 * Created with JetBrains WebStorm.
 * User: Baoxu Shi
 * Date: 13-3-5
 * Time: AM11:27
 * To change this template use File | Settings | File Templates.
 */

var util = require('util');
var fs = require('fs');
var http = require('http');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var should = require('should');

var httpRequestHandler = require('./httpRequestHandler.js');

var httpRequestManager = function(urlItem, host, port, concurrency, maxDelay){
    EventEmitter.call(this);

    this.on('initRequestHandler', initRequestHandler);
    this.on('start', runRequestHandler);
    this.on('stop', stopRequestHandler);


    this.clientList = [];
    this.status = {'success':0, 'error':0};


    if(typeof host == 'string'){
        this.host = host;
    }else{
        throw new Error('host must be string');
    }
    if(typeof port == 'number'){
        this.port = port;
    }else{
        throw new Error('port must be number');
    }
    if(typeof concurrency == 'number'){
        this.concurrency = concurrency;
    }else{
        throw new Error('concurrency must be number');
    }
    if(typeof maxDelay == 'number'){
        this.maxDelay = maxDelay;
    }else{
        throw new Error('maxDelay must be a number');
    }

    if(typeof urlItem == 'object'){
        this.getUrlFromJSON(urlItem);
    }else{
        this.getUrlFromFiles(urlItem);
    }

};
util.inherits(httpRequestManager, EventEmitter);


var p = httpRequestManager.prototype;

p.getUrlFromFiles = function(path){
    var self = this;
    if(typeof path == 'string'){
        fs.readFile(path, 'utf8', function(err, data){
            if(err){
                throw err;
            }else{
                var lines = data.split('\r\n');
                self.optionList = [];
                for(var i = 0 ; i < lines.length; i++){
                    lines[i] = lines[i].split('--POSTDATA');
                    var option = {
                        'options' : {
                            'host' : self.host,
                            'port' : self.port,
                            'method' : lines[i].length == 2 ? 'POST' : 'GET'
                        },
                        'data' : !lines[i][1] ? null : lines[i][1]
                    };
                    self.optionList.push(option);
                }

                self.emit('initRequestHandler', self);

            }
        });
    }else{
        throw new Error('path for url file must be a string');
    }
};

p.getUrlFromJSON = function(json){
    var self = this;
    if(util.isArray(json)){
        try{
            for(var i = 0; i<json.length; i++){
                json[i].should.have.property('options');
                json[i].options.should.have.property('host');
                json[i].options.should.have.property('port');
                json[i].options.should.have.property('method');
                if(json[i].options.method=='POST'){
                    json[i].should.have.property('data');
                    if(typeof json[i].data != 'string'){
                        json[i].data = JSON.stringify(json[i].data);
                    }
                }
            }

            self.optionList = json;

            self.emit('initRequestHandler', self);

        }catch(err){
            console.log(err, err.stack);
        }
    }else{
        throw new Error('json for url must be an array');
    }
};

p.stop = function(){
    this.emit('stop', this);
    this.stopTime = new Date();
};

p.getStatus = function(){
    var status = {'success':0, 'error':0};
    for(var i = 0; i<this.clientList.length; i++){
        var tmpStatus = this.clientList[i].getFetchStatus();
        status.success +=tmpStatus.success;
        status.error +=tmpStatus.error;
    }

    status.intervalSuccess=status.success-this.status.success;
    status.intervalError=status.error-this.status.error;
    this.status = status;

    return status;

};

p.getFinalStatus = function(){
    var success=0;
    var error = 0;
    for(var i = 0; i<this.clientList.length; i++){
        var tmpStatus = this.clientList[i].getFetchStatus();
        success = tmpStatus.success;
        error = tmpStatus.error;
    }

    return {
        'Total Time' : this.stopTime-this.startTime,
        'Total Trans': success+error,
        'Success Trans' : success,
        'Error Trans' : error,
        'Success Rate' : success/(success+error) * 100,
        'Throughput' : success / Math.floor((this.stopTime-this.startTime)/1000)
        };

};

p.getFinalOutput = function(){
    var status = this.getFinalStatus();
    for(var key in status){
        util.print(key+' : '+status[key]+'\n');
    }
};

var initRequestHandler = function(self){

    for(var i = 0; i < self.concurrency; i++){
        var hRH = new httpRequestHandler();
        hRH.setOptionList(self.optionList);
        hRH.setMaxDelay(self.maxDelay);
        self.clientList.push(hRH);
    }

    self.emit('start', self);

};

var runRequestHandler = function(self){

    for(var i = 0; i < self.clientList.length; i++){
        util.debug('try start client '+i);
        self.clientList[i].start();
    }
    this.startTime = new Date();
};

var stopRequestHandler = function(self){
    for(var i = 0; i<self.clientList.length;i++){
        self.clientList[i].stop();
    }
};



module.exports = httpRequestManager;

