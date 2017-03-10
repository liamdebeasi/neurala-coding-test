# Neurala Coding Interview Test
Source code for Neurala coding test


## Installation
* Clone this repository to your local machine using
``` 
$ git clone https://github.com/liamdebeasi/neurala-coding-test.git
```
* On your local machine, run in the neurala-coding-test directory. This will install all dependencies necessary for running the server
```
$ npm install
```
_Note: macOS users may need to run `sudo npm install`_

* Place your auth.json file in the root directory

* To create the MySQL database used in this project, you can run the following from the command line if you have the MySQL command line installed:
```
mysql -u root -e "CREATE DATABASE IF NOT EXISTS neurala_debeasi"
```
_Note: If you do not have the CLI installed, you can just create a database on localhost using any database management software like PHPMyAdmin or Sequel Pro. Database Encoding should be "UTF-8 Unicode" and Database Collation should be "utf8_general_ci"_

* To setup the database's user table, run the following script which will place a user table in the "neurala_debeasi" database:
```
$ node install.js
```

* Finally, to start the Node server, run
```
$ node index.js
```

* Navigate to `http://localhost:8888` in your browser


## Project Notes
* This app is not served over HTTPS by default. In a production setting, we would want to serve it over HTTPS and enable secure session management in `index.js:60`
* Session management is stored in memory by default and as a result, would not likely scale very well. In a production setting, we would want to use a more scalable session store (See: [Compatible Session Stores](https://www.npmjs.com/package/express-session#compatible-session-stores))
