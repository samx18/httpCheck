const https = require('https');
const env = require('./env.json')
const url = require('url');
const slackChannel = '#general';
const hookUrl = env.webhook;

const slackMessage = {
    channel: slackChannel,
    text: 'Ready to begin training'
};
const body = JSON.stringify(slackMessage);
const options = url.parse(hookUrl);
options.method = 'POST';
options.headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
};

var post_req = https.request(options, function(res) {
      res.setEncoding('utf8');
      // res.on('data', function (chunk) {
      //     console.log('Response: ' + chunk);
      // });
  });

  // post the data
  post_req.write(JSON.stringify( slackMessage ));
  post_req.end();
