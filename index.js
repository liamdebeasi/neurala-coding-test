/* ------------- Application Setup ------------- */

/**
 * Declare Dependencies
 */
var express = require('express');
var expressSanitizer = require('express-sanitizer');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var jsonfile = require('jsonfile');
var bcrypt = require('bcrypt');

/*var passport = require('passport');
var local = require('passport-local').Strategy;
var session = require('express-session');
*/

/**
 * Setup Express server
 * Set JS, CSS, etc location
 * Init express input sanitizer
 * Set the rendering engine to be EJS
 * Use body parser to parse res.body
 * Setup bcrypt params
 */
var app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname + '/assets'));
app.use(expressSanitizer());

/*app.use(passport.initialize())
app.use(passport.session())
app.use(session({ session: '' }));*/

app.engine('html', require('ejs').renderFile)
app.set('view engine', 'ejs');

const saltRounds = 10;
  
/**
 * Get auth keys
 */
 var sql;
jsonfile.readFile('auth.json', function(err, obj) {

    // Connect to MySQL
    sql = mysql.createConnection({
         host     : obj.host,
         user     : obj.user,
         password : obj.password,
         database : obj.database
    });
    
    sql.connect();
});


/* ------------- Passport Functions ------------- */
/*passport.serializeUser(function(user, done) {
   done(null, user.id); 
});

passport.deserializeUser(function(id, done) {
   findUserById(id, done); 
});*/

/* ------------- Application Routing ------------- */

/**
 * Render Dashboard page
 */
app.get('/dashboard', function(req, res) {
    
    var disabled = false;
    var count = 0;
    
    // First check to see if user has already registered
    sql.query("select clicked from users where id = ?", 10, function(err, sqlRes, fields) {
        if (sqlRes.length > 0) {
            if (sqlRes[0].clicked === '1') {
                disabled = true;
            }
        }  
        
        sql.query("select count(*) as count from users where clicked = 1", function(err, sqlRes, fields) {
            if (sqlRes.length > 0) {
                count = sqlRes[0].count;
            }  
            
            res.render('dashboard.html', { disabled: disabled, count: count });      
        });
          
    });
});

/**
 * Render Login page
 */
app.get('/', function(req, res) {
   res.render('index.html'); 
});

/**
 * Render Register page
 */
app.get('/register', function(req, res) {
   res.render('register.html'); 
});

app.post('/increment', function(req, res) {
    // Sanitize inputs    
    var id = req.sanitize(req.body.id);
    
    // Set header to be JSON
    res.setHeader('Content-Type', 'application/json');
        
    // Check to see if user has already clicked button
    sql.query("select id from users where id = ? and clicked = 0", id, function(err, sqlRes, fields) {
        
        if (err) {
            res.send(JSON.stringify({ success: false, message: err }));
            res.end();   
        } else {
            
            // User has already registered
            if (sqlRes.length == 0) {
                res.send(JSON.stringify({ success: false, message: "You have already clicked the button." }));
                res.end();   
            } else {
                1
                // Set clicked = 1 for user
                sql.query('update users set clicked = 1 where id = ?', id, function(err, sqlRes, fields) {
                    
                    // If there was an error, send the message to the front end
                    if (err) {
                        res.send(JSON.stringify({ success: false, message: error }));
                        res.end();   
                    // If query was successful, send result to user
                    } else {
                        res.send(JSON.stringify({ success: true, message: "Done" }));
                        res.end();  
                    } 
                });
            }
        }
    });
});

/**
 * Attempt to register a new user
 */
app.post('/register', function(req, res) {
    
    // Sanitize inputs    
    var email = req.sanitize(req.body.email);
    var password = req.sanitize(req.body.password);
    var confirmPassword = req.sanitize(req.body.confirmPassword);
    
    // Set header to be JSON
    res.setHeader('Content-Type', 'application/json');
    
    // If passwords don't match, send error
    if (password != confirmPassword) {
        res.send(JSON.stringify({ success: false, message: "Passwords do not match"}));
        res.end();
    
    // If email was not set, throw error    
    } else if (!email) {
        res.send(JSON.stringify({ success: false, message: "Please enter a valid email"}));
        res.end();  
        
    // Otherwise, attempt to register the users
    } else {
        
        // First check to see if user has already registered
        sql.query("select * from users where email = ?", email, function(err, sqlRes, fields) {
            if (err) {
                res.send(JSON.stringify({ success: false, message: error }));
                res.end();   
            } else {
                
                // User has already registered
                if (sqlRes.length > 0) {
                    res.send(JSON.stringify({ success: false, message: "You have already registered using that email." }));
                    res.end();   
                } else {
                    
                    // Encrypt password using a Promise
                    // this allows the server to service other requests
                    // If we just a non-async implementation, the hashing would
                    // block the application since bcrypt is CPU intensive
                    bcrypt.hash(password, saltRounds).then(function(hash) {
                        
                        // The ?s also escape the inputs before inserting into the DB
                        sql.query('insert into users (email, password) values (?, ?)', [email, hash], function(err, sqlRes, fields) {
                            
                            // If there was an error, send the message to the front end
                            if (err) {
                                res.send(JSON.stringify({ success: false, message: error }));
                                res.end();   
                            // If query was successful, send result to user
                            } else {
                                res.send(JSON.stringify({ success: true, message: { email: email, password: password, confirmPassword: confirmPassword }}));
                                res.end();  
                            } 
                        });
                        
                    });
                }
            }
        });
    }
});


/**
 * Attempt to sign a user in
 */
app.post('/login', function(req, res) {
    
    // Sanitize inputs    
    var email = req.sanitize(req.body.email);
    var password = req.sanitize(req.body.password);
    
    // Set header to be JSON
    res.setHeader('Content-Type', 'application/json');
    
    // If password not set
    if (!password) {
        res.send(JSON.stringify({ success: false, message: "Please enter a password"}));
        res.end();
    
    // If email was not set, throw error    
    } else if (!email) {
        res.send(JSON.stringify({ success: false, message: "Please enter a valid email"}));
        res.end();  
        
    // Otherwise, attempt to login the user
    } else {
    
        // Get user to check password
        sql.query('select password from users where email = ?', email, function(err, sqlRes, fields) {
            
            // If there was an error, send the message to the front end
            if (err) {
                res.send(JSON.stringify({ success: false, message: error }));
                res.end();   
            // If user doesn't exist, send error
            } else if (sqlRes.length == 0) {
                res.send(JSON.stringify({ success: false, message: "Your email or password does not match"}));
                res.end();
            // If query was successful, send result to user
            } else {
                bcrypt.compare(password, sqlRes[0].password, function(err, bcryptRes) {
                    // If passwords match, log user in
                    if (bcryptRes) {
                        res.send(JSON.stringify({ success: true, message: "Logged in"}));
                        res.end();
                    // Otherwise, send error
                    } else {
                        res.send(JSON.stringify({ success: false, message: "Your email or password does not match"}));
                        res.end();
                    }
                });
            } 
        });

    }
});

console.log('Listening on 8888');
app.listen(8888);
