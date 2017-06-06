var am = require('../accountManager');

 module.exports = function(bot, FRONTEND_LOGIN_URL){
    bot.dialog('/login',[
        function(session, args,next)
        {
            am.login(session,FRONTEND_LOGIN_URL);
        }
    ]);
 };