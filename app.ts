var restify = require('restify');
var builder = require('botbuilder');
var http = require('http');
var request = require('request');
var rp = require('request-promise')
var parseString = require('xml2js').parseString;
var urlencode = require('urlencode');

var tokenHandler = require('./tokenHandler');
var APIComm = require('./APICommunicator');
var cards = require('./cards');
var customRecognizer = require('./recognizers/customRecognizer');
import { Models } from './Models';

var BACKEND_LOGIN_URL = process.env.BACKEND_LOGIN_URL;

const dialog = {
    default: require('./dialogs/default'),
    login: require('./dialogs/login'),
    showCart: require('./dialogs/getItems'),
    logout: require('./dialogs/logout'),
    changeLanguage: require('./dialogs/changeLanguage')
};

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s yes', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId:  process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

//Listen for messages from users 
server.post('/api/messages', connector.listen());

//called by backend after logged in thru page
server.get('/authorize', restify.queryParser(), function (req, res, next) {
    if (req.query && req.query.redirect_uri && req.query.token) {
        var token = req.query.token;
        var refreshToken = req.query.refresh_token;
        var tokenGeneratedAt = Date.now();
        var userName = req.query.user_name;
        // The authorization_code query string
        // argument is an arbitrary pass-through value that could be stored as well
        // to enable verifying it once Facebook sends the `Account Linking webhook event
        // that we handle below. In this case, we are passing the API token, refresh token and username via the authorization_code
        var redirectUri = req.query.redirect_uri + '&authorization_code=' + token + ';' + refreshToken + ';' + tokenGeneratedAt + ';' + userName;
        return res.redirect(redirectUri, next);
    } else {
        return res.send(400, 'Request did not contain redirect_uri and username in the query string');
    }
});

var bot = new builder.UniversalBot(connector, {
    localizerSettings: {
        defaultLocale: "sk"
    }
});

// Start generating tokens needed to use the translator API and set translation Locales
tokenHandler.init();
var FROMLOCALE = 'sk';
var TOLOCALE = 'en';


// Text translation, before we send data to LUIS.ai
bot.use({
    receive: function (event, next) {
        if (event.textLocale == "sk-SK") {
            var token = tokenHandler.token();
            if (token && token !== "") { //not null or empty string
                var urlencodedtext = urlencode(event.text); // convert foreign characters to utf8
                var options = {
                    method: 'GET',
                    url: 'http://api.microsofttranslator.com/v2/Http.svc/Translate' + '?text=' + urlencodedtext + '&from=' + FROMLOCALE + '&to=' + TOLOCALE,
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                };
                request(options, function (error, response, body) {
                    //Check for error
                    if (error) {
                        return console.log('Error:', error);
                    } else if (response.statusCode !== 200) {
                        return console.log('Invalid Status Code Returned:', response.statusCode);
                    } else {
                        // Returns in xml format, no json option :(
                        parseString(body, function (err, result) {
                            console.log(result.string._);
                            event.text = result.string._;
                            next();
                        });

                    }
                });
            } else {
                console.log("No token");
                next();
            }
        }
        else {
            next();
        }
    }
});

//=========================================================
// Bots Dialogs
//=========================================================

var luisRecognizer = new builder.LuisRecognizer(process.env.LUIS_CONNECTION);

var intents = new builder.IntentDialog({
    recognizers: [
        customRecognizer,
        luisRecognizer
    ],
    intentThreshold: 0.2,
    recognizeOrder: builder.RecognizeOrder.series
});

bot.dialog('/', intents);
dialog.showCart(bot);
dialog.login(bot, BACKEND_LOGIN_URL);
dialog.logout(bot);
dialog.changeLanguage(bot);

//locale picker
intents.matches(/^change language/i, '/changeLanguage');
intents.matches(/^getItems/i, '/getItems');
intents.matches(/^login/i, '/login');
intents.matches(/^logout/i, '/logout');
intents.matches('Help', function (session) {
    session.endDialog("help");
})

intents.onDefault(function (session) {
    dialog.default(session);
});


//Here we demonstrate how to handle entities indetified by LUIS 
bot.dialog('/luis/openinghrs', [
    function (session, args) {
        // Resolve and store any entities passed from LUIS.
        var dateEntity = builder.EntityRecognizer.findEntity(args.entities, 'builtin.datetime.date');
        if (dateEntity) {
            // User specified a date
            var date = new Date(dateEntity.resolution.date);
            // Year parsing is inconsistent so we set the year ourselves if the year parsed is less than the current year (we assume the user wouldn't ask about opening hours of previous years)
            var now = new Date();
            if (date.getFullYear() < now.getFullYear()) {
                if (date.getMonth() >= now.getMonth() && date.getDate() >= now.getDate()) {
                    // Day/month is either today or later in the year
                    date.setFullYear(now.getFullYear());
                } else {
                    // The day/month is less than the current day/month, meaning user is likely referring to next year
                    date.setFullYear(now.getFullYear() + 1);
                }
            }
        }
    }
]);






