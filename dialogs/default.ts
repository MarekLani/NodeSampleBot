var builder = require('botbuilder');

module.exports = function(session) {

    session.sendTyping();


    //Get localized string
    var locale = session.preferredLocale()
    if(locale != 'sk')
    locale = 'en';
    var text = session.localizer.gettext(locale,"help");


    //Suggested actions TODO: add to beginning of conversation
    var msg = new builder.Message(session)
    .text(text)
    .suggestedActions(
        builder.SuggestedActions.create(
                session, [
                    builder.CardAction.imBack(session, "productId=1&color=green", "Green"),
                    builder.CardAction.imBack(session, "productId=1&color=blue", "Blue"),
                    builder.CardAction.imBack(session, "productId=1&color=red", "Red")
                ]
            ));
    session.send(msg);

//Account linking
  var accountLinking = session.message.sourceEvent.account_linking;
  if (accountLinking) {
    // This is the handling for the `Account Linking webhook event` where we could
    // verify the authorization_code and that the linking was successful.
    var data = accountLinking.authorization_code;
   
    var authorizationStatus = accountLinking.status;
    if (authorizationStatus === 'linked') {
       var data = data.split(';');
      // Persist token and userName under the userData
      session.userData.token = data[0];
      session.userData.refreshToken = data[1];
      session.userData.tokenGeneratedAt = data[2];
      var name = data[3];
      session.userData.userName = name;
      session.endDialog('Account linked - you are now known as ' + name);
    } else if (authorizationStatus === 'unlinked') {
      // Remove username from the userData
      delete session.userData.token;
      delete session.userData.userName;
      delete session.userData.tokenGeneratedAt;
      session.endDialog('Account unlinked');
    } else {
      session.endDialog('Unknown account linking event received');
    }
  } else {
    var userName = session.userData.userName;
    if (userName) {
      session.endDialog('You are known as ' + userName + ' - type "unlink account" to try out unlinking');
    } else {
      session.endDialog('I hear you - type "link account" to try out account linking');
    }
  }
};