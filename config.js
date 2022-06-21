const mysql = require('mysql');
var conn = mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'phim_lau' });
module.exports = conn;