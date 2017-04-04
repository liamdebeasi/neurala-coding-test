/* ------------- Application Setup ------------- */

/**
 * Declare Dependencies
 */
var express = require('express');
var expressSanitizer = require('express-sanitizer');
var bodyParser = require('body-parser');
var fs = require('fs');
var crypto = require('crypto');
var https = require('https');

/**
 * Setup Express server
 * Set JS, CSS, etc location
 * Init express input sanitizer
 * Set the rendering engine to be EJS
 * Use body parser to parse res.body
 */
var app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname + '/assets'));
app.use(expressSanitizer());


/**
 * Get auth keys
 */
var config;

try {
    config = require('./auth.json');
} catch(err) {
    config = {};
    console.log('Unable to read auth.json');
}

var apiKey = config.key;

app.engine('html', require('ejs').renderFile)
app.set('view engine', 'ejs');


/* ------------- Application Routing ------------- */

app.get('/getAllStops', function(req, parentRes) {
    var color = req.sanitize(req.query.color);
    var checksum = crypto.createHash('sha1');
    
    switch(color) {
        case 'green':
            var url = 'https://realtime.mbta.com/developer/api/v2/stopsbyroute?api_key=' + apiKey + '&route=Green-B&format=json';
            console.log("GET",url);
            https.get(url, function(res) {
                var output = '';
                            
                res.on('data', function(chunk) {
                   output += chunk; 
                   checksum.update(chunk);
                });
                
                res.on('end', function() {
                    output = JSON.parse(output);
                    var toReturn = {};
                    
                    output.direction.forEach(function(routeDirection) {
                        var direction = (routeDirection.direction_name == "Eastbound") ? 'outbound' : 'inbound';
                        toReturn[direction] = routeDirection.stop;
                    });
                    
                    parentRes.send(JSON.stringify({ success: true, data: toReturn, checksum: checksum.digest('hex')}));
                    parentRes.end();  
                });
            });
            
            break;
        default:
            parentRes.send(JSON.stringify({ success: false, data: 'Invalid rail color'}));
            parentRes.end(); 
            break;
    }

});


app.get('/getPredictionForStop', function(req, parentRes) {
   var stop = req.sanitize(req.query.stop); 
   var url = 'https://realtime.mbta.com/developer/api/v2/predictionsbystop?api_key=' + apiKey + '&stop=' + stop + '&format=json';
   //var checksum = crypto.createHash('sha1');
   
   https.get(url, function(res) {
        var output = '';
                    
        res.on('data', function(chunk) {
           output += chunk; 
           //checksum.update(chunk);
        });
        
        res.on('end', function() {
            output = JSON.parse(output);
/*
            var toReturn = {};
            
            output.direction.forEach(function(routeDirection) {
                var direction = (routeDirection.direction_name == "Eastbound") ? 'outbound' : 'inbound';
                toReturn[direction] = routeDirection.stop;
            });
*/
            
            parentRes.send(JSON.stringify({ success: true, data: output}));
            parentRes.end();  
        });
    });
});
console.log('Server running on port 8888');
app.listen(8888);
