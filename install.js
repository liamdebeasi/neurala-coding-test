/* ------------- Application Setup ------------- */

/**
 * Declare Dependencies
 */
var mysql = require('mysql');
var fs = require('fs');

/**
 * Get auth keys
 * Connect to MySQL
 */
var config;
var sql;

try {
    config = require('./auth.json');
    
    // Connect to MySQL
    sql = mysql.createConnection({
         host     : config.host,
         user     : config.user,
         password : config.password,
         database : config.database
    });
    
    sql.connect();

   sql.query('create table users (id int(11) unsigned auto_increment primary key, email varchar(255) not null, password varchar(255) not null, clicked int(1) default 0)', function(err, sqlRes, fields) {
        if (err) { console.log('Error:', err); process.exit(1); } 
        else {
           console.log("Installation done!");
           process.exit();
        } 
    });
    
    
} catch(err) {
    config = {};
    console.log('Unable to read auth.json');
    process.exit(1);
}