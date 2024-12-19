import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'appUserTT',
    password: 'passWord',
    database: 'trade_ticker',
});

export default pool;
