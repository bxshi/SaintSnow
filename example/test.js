/**
 * Created with JetBrains WebStorm.
 * User: Baoxu Shi
 * Date: 13-3-5
 * Time: PM12:17
 * To change this template use File | Settings | File Templates.
 */

var httpRequestManager = require('../lib/httpRequestManager.js');

var optionList = [
    {
        'options' : {
            'host' : 'www.baidu.com',
            'port' : 80,
            'path' : '/',
            'method' : 'GET'
        }
    },
    {
        'options' : {
            'host' : 'www.baidu.com',
            'port' : 80,
            'path' : '/',
            'method' : 'POST'
        },
        'data' : {
            'hello' : 'world'
        }
    }
];

var hRM = new httpRequestManager(optionList, '127.0.0.1', 8000, 1, 0);


process.on('uncaughtException', function(err){
    console.log(err, err.stack);
});

process.on('SIGINT', function(){
    process.exit(0);
});

setInterval(function(){
    console.log(JSON.stringify(hRM.getStatus()));
},1000);

setTimeout(function(){
    hRM.stop();
    hRM.getFinalOutput();
    process.exit(0);
}, 10000);