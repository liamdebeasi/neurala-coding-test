/* ------------- Application Setup ------------- */

/**
 * Declare Dependencies
 */
var express = require('express');
var expressSanitizer = require('express-sanitizer');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var bcrypt = require('bcrypt');
var fs = require('fs');

var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var session = require('express-session');
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


/**
 * Get auth keys
 * Connect to MySQL
 */
var config;

try {
    config = require('./auth.json');
} catch(err) {
    config = {};
    console.log('Unable to read auth.json');
}

// Connect to MySQL
var sql = mysql.createConnection({
     host     : config.host,
     user     : config.user,
     password : config.password,
     database : config.database
});

sql.connect();

// Setup session handling
app.use(session({ 
    secret: config.sessionSecret,
    httpOnly: true, // prevent browser JS from accessing cookies
    resave: false, 
    saveUninitialized: false
    //cookie: { secure: true } // if this were being served over HTTPS, we would want this on to ensure that
    // all cookies are secure
}));

// Setup passport strategy
passport.use(new Strategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function(email, password, done) {
        // If password not set
        if (!password) {
            return done(null, false);
        
        // If email was not set, throw error    
        } else if (!email) {
            return done(null, false);
            
        // Otherwise, attempt to login the user
        } else {
        
            // Get user to check password
            sql.query('select id, password from users where email = ?', email, function(err, sqlRes, fields) {
                // If there was an error, send the message to the front end
                if (err) {
                    return done(err);   
                // If user doesn't exist, send error
                } else if (sqlRes.length == 0) {
                    return done(null, false);
                // If query was successful, send result to user
                } else {
                    bcrypt.compare(password, sqlRes[0].password, function(err, bcryptRes) {
                        // If passwords match, log user in
                        if (bcryptRes) {
                            return done(null, { id: sqlRes[0].id })
                        // Otherwise, send error
                        } else {
                            return done(null, false);
                        }
                    });
                } 
            });
        }
    }
));

/* ------------- Passport Functions ------------- */
passport.serializeUser(function(user, done) {
    done(null, user.id); 
});

passport.deserializeUser(function(id, done) {
    // Check to see if user exists
    sql.query('select id from users where id = ?', id, function(err, sqlRes, fields) {
       if (err) {
           done(err);
       } else if (sqlRes.length == 0) {
           done(null);
       } else {
           done(null, { id: sqlRes[0].id })
       }
    });
});

// Initialize passport and restore auth state if any
app.use(passport.initialize());
app.use(passport.session());


app.engine('html', require('ejs').renderFile)
app.set('view engine', 'ejs');

const saltRounds = 10;


/* ------------- Application Routing ------------- */

/**
 * Render Dashboard page
 */
app.get('/dashboard',
    
    // Make sure user is logged in
    // otherwise, send them to the login page
    require('connect-ensure-login').ensureLoggedIn('/'),
    function(req, res) {
        
        var disabled = false;
        var count = 0;
        
        // First check to see if user has already clicked
        sql.query("select clicked from users where id = ?", req.user.id, function(err, sqlRes, fields) {
            if (sqlRes.length > 0) {
                if (sqlRes[0].clicked === '1') {
                    disabled = true;
                }
            }  
            
            // Get total count of clicks
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
app.get('/', 
    require('connect-ensure-login').ensureLoggedOut('/dashboard'),
    function(req, res) {
        res.render('index.html'); 
});

/**
 * Sign a user out and redirect them to the login page
 */
app.get('/logout', function(req, res) {
   req.logout();
   res.redirect('/'); 
});

/**
 * Render Register page
 */
app.get('/register', function(req, res) {
   res.render('register.html'); 
});

/**
 * Button Click Event
 */
app.post('/increment', function(req, res) {
    // Sanitize inputs    
    var id = req.user.id;
    
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
                res.send(JSON.stringify({ success: false, message: "That email has already been registered." }));
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
                    res.send(JSON.stringify({ success: false, message: "This email has already been registered" }));
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
                                passport.authenticate('local')(req, res, function() {
                                   res.send(JSON.stringify({ success: true, message: { email: email, password: password, confirmPassword: confirmPassword }}));
                                   res.end();  
                                }); 
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
app.post('/login', 
    passport.authenticate('local'),
    function(req, res) {
        res.send(JSON.stringify({ success: true}));
        res.end();
});


console.log('Server running on port 8888');
app.listen(8888);
