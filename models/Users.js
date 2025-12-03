// models/User.js
const db = require('./db');

const User = {
  create({ username, email, password, address, contact, role }, callback) {
    const sql = 'INSERT INTO users (username, email, password, address, contact, role) VALUES (?, ?, SHA1(?), ?, ?, ?)';
    db.query(sql, [username, email, password, address, contact, role], callback);
  },

  getAll(callback) {
    const sql = 'SELECT id, username, email, address, contact, role FROM users';
    db.query(sql, callback);
  },

  getById(id, callback) {
    const sql = 'SELECT id, username, email, address, contact, role FROM users WHERE id = ?';
    db.query(sql, [id], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0]);
    });
  },

  update(id, { username, email, address, contact, role }, callback) {
    const sql = 'UPDATE users SET username = ?, email = ?, address = ?, contact = ?, role = ? WHERE id = ?';
    db.query(sql, [username, email, address, contact, role, id], callback);
  },

  findByEmailAndPassword(email, password, callback) {
    const sql = 'SELECT * FROM users WHERE email = ? AND password = SHA1(?)';
    db.query(sql, [email, password], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0]); // undefined if not found
    });
  }
};

module.exports = User;
