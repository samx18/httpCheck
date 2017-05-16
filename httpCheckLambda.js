"use strict";
const http = require('http');
const https = require('https');
const url = require('url');
let statusCode = 0;
let healthCheck = false; // Keep healthcheck as false till it passes
let errorFlag = false; // Flag used to prevent node from publishing to slack more than once in case of an error & timeout
const slackChannel = process.env.SLACK_CHANNEL;
const hookUrl = process.env.SLACK_WEBHOOK;



function getHealthCheckStatus(healthCheck,callback){
  var options = {
      method: 'HEAD',
      host: process.env.EBS_HOST,
      path: process.env.EBS_PATH,
      port: process.env.EBS_PORT
  };
  var req = https.get(options, function(res) {
    statusCode = res.statusCode;
    console.log(JSON.stringify(res.headers));
    console.log(statusCode);
    if (statusCode == 200) {
        healthCheck = true;
    }
    callback(healthCheck,statusCode);
  });

  // handle apache errors
  req.on('error', function(err) {
    console.log('Error occoured!');
    console.log(err);
    callback(healthCheck,statusCode);
    errorFlag = true;
  });

  // handle timeouts for ports not open or the server itself is down

  req.setTimeout( 2000, function( ) {
      console.log('Timeout occured!');
      callback(healthCheck,statusCode);
      req.abort();
      errorFlag = true;
  });
}



exports.handler = (event, context, callback) => {
  getHealthCheckStatus(healthCheck,function(x){
    var data;
    if (x){
      console.log('HTTP health check passed.');
      data = 'Initializing health check for `Emtek` \n Received HTTP Status Code `' + statusCode + '` for dealer site. :ok:';
    }else{
      console.log('HTTP health check failed, please have a look');
      data = 'Initializing health check for `Emtek` \n Received HTTP Status Code `' + statusCode + '` for dealer site. :warning: please have a look.'
    }
    const slackMessage = {
        channel: slackChannel,
        text: data
    };
    const body = JSON.stringify(slackMessage);
    const options = url.parse(hookUrl);
    options.method = 'POST';
    options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
    };
    // Post to slack only if the error flag is false, default mode and will post for the first error - hhtp or timeout
    if (!errorFlag){
      var post_req = https.request(options, function(res) {
        // debug response from webhook
        // res.setEncoding('utf8');
        // res.on('data', function (chunk) {
        //     console.log('Response: ' + chunk);
        // });
      });

        // post the data
        post_req.write(JSON.stringify( slackMessage ));
        post_req.end();
      }
  });
    //callback(null, 'Hello from Lambda');
};
