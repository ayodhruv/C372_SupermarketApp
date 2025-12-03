// models/CartItem.js
const db = require('./db');

const CartItem = {
  addOrUpdate(userId, productId, quantityToAdd, callback) {
    const checkSql = 'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?';
    db.query(checkSql, [userId, productId], (err, rows) => {
      if (err) return callback(err);

      if (rows.length > 0) {
        const existing = rows[0];
        const newQty = existing.quantity + quantityToAdd;
        const updateSql = 'UPDATE cart_items SET quantity = ? WHERE id = ?';
        db.query(updateSql, [newQty, existing.id], callback);
      } else {
        const insertSql = 'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)';
        db.query(insertSql, [userId, productId, quantityToAdd], callback);
      }
    });
  },

  getCartForUser(userId, callback) {
    const sql = `
      SELECT 
        c.id AS cartItemId,
        c.quantity,
        c.product_id AS productId,
        p.productName,
        p.price,
        p.image,
        p.quantity AS stock
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `;
    db.query(sql, [userId], callback);
  },

  updateQuantity(cartItemId, userId, newQty, callback) {
    const sql = 'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?';
    db.query(sql, [newQty, cartItemId, userId], callback);
  },

  deleteItem(cartItemId, userId, callback) {
    const sql = 'DELETE FROM cart_items WHERE id = ? AND user_id = ?';
    db.query(sql, [cartItemId, userId], callback);
  },

  clearUserCart(userId, callback) {
    const sql = 'DELETE FROM cart_items WHERE user_id = ?';
    db.query(sql, [userId], callback);
  }
};

module.exports = CartItem;
