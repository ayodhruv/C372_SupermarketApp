// controllers/cartController.js
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const notificationController = require('./notificationController');

exports.addToCart = (req, res) => {
  const productId = parseInt(req.params.id);
  const quantityToAdd = parseInt(req.body.quantity) || 1;
  const userId = req.session.user.id;

  Product.getById(productId, (err, product) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error loading product');
    }
    if (!product) return res.status(404).send('Product not found');

    CartItem.addOrUpdate(userId, productId, quantityToAdd, (err2) => {
      if (err2) {
        console.error('Error adding to cart:', err2);
        return res.status(500).send('Error adding to cart');
      }
      res.redirect('/cart');
    });
  });
};

exports.showCart = (req, res) => {
  const userId = req.session.user.id;

  CartItem.getCartForUser(userId, (err, rows) => {
    if (err) {
      console.error('Error fetching cart items:', err);
      return res.status(500).send('Error loading cart');
    }
    res.render('cart', { cart: rows, user: req.session.user });
  });
};

exports.updateCartItem = (req, res) => {
  const cartItemId = req.params.id;
  const newQty = parseInt(req.body.quantity);
  const userId = req.session.user.id;

  if (isNaN(newQty) || newQty < 1) {
    return res.redirect('/cart');
  }

  CartItem.updateQuantity(cartItemId, userId, newQty, (err) => {
    if (err) {
      console.error('Error updating cart item:', err);
      return res.status(500).send('Error updating cart item');
    }
    res.redirect('/cart');
  });
};

exports.deleteCartItem = (req, res) => {
  const cartItemId = req.params.id;
  const userId = req.session.user.id;

  CartItem.deleteItem(cartItemId, userId, (err) => {
    if (err) {
      console.error('Error deleting cart item:', err);
      return res.status(500).send('Error deleting cart item');
    }
    res.redirect('/cart');
  });
};

exports.showCheckout = (req, res) => {
  const userId = req.session.user.id;

  CartItem.getCartForUser(userId, (err, rows) => {
    if (err) {
      console.error('Error fetching cart for checkout:', err);
      return res.status(500).send('Error loading checkout');
    }

    const total = Array.isArray(rows)
      ? rows.reduce((sum, item) => sum + item.price * item.quantity, 0)
      : 0;

    res.render('checkout', {
      cart: rows || [],
      total,
      user: req.session.user,
      completed: false,
      orderId: null,
      orderTimestamp: null
    });
  });
};

exports.checkout = (req, res) => {
  const userId = req.session.user.id;

  CartItem.getCartForUser(userId, (err, rows) => {
    if (err) {
      console.error('Error retrieving cart before checkout:', err);
      return res.status(500).send('Error during checkout');
    }

    const items = Array.isArray(rows) ? rows : [];

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const insufficient = items.find((item) => item.quantity > item.stock);
    if (insufficient) {
      return res
        .status(400)
        .send(`Not enough stock for ${insufficient.productName}. Available: ${insufficient.stock}`);
    }

    const orderId = `INV-${Date.now()}`;
    const orderTimestamp = new Date().toLocaleString();

    // Reduce stock for each product before clearing the cart
    const updateStockSequentially = (index) => {
      if (index >= items.length) {
        CartItem.clearUserCart(userId, (clearErr) => {
          if (clearErr) {
            console.error('Error during checkout:', clearErr);
            return res.status(500).send('Error during checkout');
          }

          notificationController.addNotification(req, {
            type: 'Order Confirmation',
            title: 'Order placed successfully',
            message: `Order ${orderId} confirmed. Total $${total.toFixed(2)}.`,
            link: '/checkout'
          });
          notificationController.addNotification(req, {
            type: 'Invoice',
            title: 'Invoice available',
            message: `Invoice for ${orderId} is ready.`,
            link: '/checkout'
          });

          res.render('checkout', {
            cart: items,
            total,
            user: req.session.user,
            completed: true,
            orderId,
            orderTimestamp
          });
        });
        return;
      }

      const item = items[index];
      Product.decrementQuantity(item.productId, item.quantity, (decrementErr, result) => {
        if (decrementErr) {
          console.error('Error updating stock:', decrementErr);
          return res.status(500).send('Error updating stock during checkout');
        }

        if (!result.affectedRows) {
          return res
            .status(400)
            .send(`Not enough stock for ${item.productName}. Available: ${item.stock}`);
        }

        updateStockSequentially(index + 1);
      });
    };

    updateStockSequentially(0);
  });
};
