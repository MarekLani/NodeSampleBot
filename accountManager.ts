var request = require('request');
var builder = require('botbuilder');

module.exports = {

    logout: function(session){
          request({
                url: 'https://graph.facebook.com/v2.6/me/unlink_accounts',
                method: 'POST',
                qs: {
                    access_token: process.env.FACEBOOK_PAGE_TOKEN
                },
                body: {
                    psid: session.message.address.user.id
                },
                json: true
                }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    // No need to do anything send anything to the user
                    // in the success case since we respond only after
                    // we have received the account unlinking webhook
                    // event from Facebook.
                    session.endDialog();
                } else {
                    session.endDialog('Error while unlinking account');
                }
            });
    },
    login: function (session, BACKEND_LOGIN_URL)
    {
        var message = new builder.Message(session)
            .sourceEvent({
                facebook: {
                attachment: {
                    type: 'template',
                    payload: {
                    template_type: 'generic',
                    elements: [{
                        title: 'Welcome to Account Linking',
                        buttons: [{
                        type: 'account_link',
                        url: BACKEND_LOGIN_URL
                        }]
                    }]
                    }
                }
                }
            });
            session.endDialog(message);
    }
}