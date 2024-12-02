import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: 'localhost',
    user: 'appUser',
    password: 'passWord',
    database: 'stockTrackerApp',
});

export default pool;
