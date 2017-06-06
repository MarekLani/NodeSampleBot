 var rp = require('request-promise')
 var ac = require('../APICommunicator');

 module.exports = function(bot){
    bot.dialog('/getItems',[
        function(session, args,next)
        {
            ac.getItems(session);
        }
    ]);
 };