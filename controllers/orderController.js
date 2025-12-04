// controllers/orderController.js

exports.listOrders = (req, res) => {
  const orders = req.session.orders || [];
  res.render('orders', {
    user: req.session.user,
    orders
  });
};
