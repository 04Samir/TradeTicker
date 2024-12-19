import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'trade_ticker',
});

export default pool;
