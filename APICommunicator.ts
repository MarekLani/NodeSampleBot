
var http = require('http');
var request = require('request');
var rp = require('request-promise');
var am = require('./accountManager');
import {Models} from './Models';

const tokenValidityPeriod = 1000 * 60 * 60 * 23; //23 hours in ms
const BACKEND_URL = 'backendurl';

module.exports = {
    getItems: function(session)
    {
        checkTokenValidity(session);

        //getData
        var storedToken = session.userData.token;
        if (storedToken) {
            var res = rp(BACKEND_URL+'/getItems', {headers: {'Authorization':'Bearer '+ storedToken}})
            
            res.then(function(result){
                var jsonRes = JSON.parse(result);
                console.log(jsonRes);
                session.send(jsonRes[0].name)
            });
        }
       session.endDialog();
    }
}

function checkTokenValidity(session)
{
    var tokenGeneratedAt = session.userData.tokenGeneratedAt;
    
    if(tokenGeneratedAt && (Date.now() - tokenGeneratedAt ) < tokenValidityPeriod)
    {
        //we can continue with request
    }
    else
    {
        //We need to refresh tokenGeneratedAt
        var refreshToken = session.userData.refreshToken;
        var res = rp(BACKEND_URL+'/refreshtoken', { headers: { 'Authorization': 'Bearer ' + refreshToken } })
         res.then(function(){

         })
         .catch(function(){
            session.send("We are sorry, there was error related to your account. Please login again.")
            am.logout(session);
            am.login(session);
         });
         
    }

}

