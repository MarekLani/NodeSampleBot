var am = require('../accountManager');

 module.exports = function(bot, FRONTEND_LOGIN_URL){
    bot.dialog('/logout',[
        function(session, args,next)
        {
          am.logout(session);
        }
    ]);
 };