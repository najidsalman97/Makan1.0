import Database from 'better-sqlite3';

const db = new Database('sqlite.db');
const columns = db.pragma('table_info(users)');
console.log('Columns in users table:', columns);
