CREATE USER IF NOT EXISTS 'appUser'@'localhost' IDENTIFIED WITH 'mysql_native_password' BY 'passWord';
GRANT ALL PRIVILEGES ON *.* TO 'appUser'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;

DROP DATABASE IF EXISTS stockTrackerApp;
CREATE DATABASE stockTrackerApp;
USE stockTrackerApp;
