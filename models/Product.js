// models/Product.js
const db = require('./db');

const Product = {
  getAll(callbackOrFilters, maybeCallback) {
    // Support signature getAll(callback) and getAll(filters, callback) for reuse
    const callback = typeof callbackOrFilters === 'function' ? callbackOrFilters : maybeCallback;
    db.query('SELECT * FROM products', (err, rows) => {
      if (callback) callback(err, rows);
    });
  },

  getById(id, callback) {
    db.query('SELECT * FROM products WHERE id = ?', [id], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0]);
    });
  },

  create({ name, quantity, price, image }, callback) {
    const sql = 'INSERT INTO products (productName, quantity, price, image) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, quantity, price, image], callback);
  },

  update(id, { name, quantity, price, image }, callback) {
    const sql = 'UPDATE products SET productName = ?, quantity = ?, price = ?, image = ? WHERE id = ?';
    db.query(sql, [name, quantity, price, image, id], callback);
  },

  search({ term, minPrice, maxPrice }, callback) {
    const conditions = [];
    const params = [];

    if (term) {
      conditions.push('productName LIKE ?');
      params.push(`%${term}%`);
    }

    if (!isNaN(minPrice)) {
      conditions.push('price >= ?');
      params.push(minPrice);
    }

    if (!isNaN(maxPrice)) {
      conditions.push('price <= ?');
      params.push(maxPrice);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM products ${whereClause}`;
    db.query(sql, params, callback);
  },

  decrementQuantity(id, amount, callback) {
    const sql = 'UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ?';
    db.query(sql, [amount, id, amount], (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    });
  },

  delete(id, callback) {
    db.query('DELETE FROM products WHERE id = ?', [id], callback);
  }
};

module.exports = Product;
