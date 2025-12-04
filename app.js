const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');

const userController = require('./controllers/userController');
const productController = require('./controllers/productController');
const cartController = require('./controllers/cartController');
const notificationController = require('./controllers/notificationController');
const orderController = require('./controllers/orderController');

const app = express();

// view engine + static + body parsing
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// session + flash
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

app.use(flash());

// expose notifications to views
app.use((req, res, next) => {
  res.locals.notifications = req.session.notifications || [];
  next();
});

// auth middlewares
const checkAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  req.flash('error', 'Please log in to view this resource');
  res.redirect('/login');
};

const checkAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  req.flash('error', 'Access denied');
  res.redirect('/shopping');
};

// Home page
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

// Auth routes
app.get('/register', userController.showRegister);
app.post('/register', userController.handleRegister);

app.get('/login', userController.showLogin);
app.post('/login', userController.handleLogin);

app.get('/logout', userController.logout);

// Profile
app.get('/profile', checkAuthenticated, userController.showProfile);
app.post('/profile', checkAuthenticated, userController.handleProfileUpdate);

// Product routes
app.get('/inventory', checkAuthenticated, checkAdmin, productController.showInventory);

// Notifications
app.get('/notifications', checkAuthenticated, notificationController.listNotifications);
app.post('/notifications/mark-read', checkAuthenticated, notificationController.markAllRead);

// Orders
app.get('/orders', checkAuthenticated, orderController.listOrders);

// Admin user management
app.get('/users', checkAuthenticated, checkAdmin, userController.listUsers);
app.get('/users/:id/edit', checkAuthenticated, checkAdmin, userController.showEditUser);
app.post('/users/:id/edit', checkAuthenticated, checkAdmin, userController.handleEditUser);

app.get('/shopping', checkAuthenticated, productController.showShopping);
app.get('/product/:id', checkAuthenticated, productController.showProductDetail);

app.get('/addProduct', checkAuthenticated, checkAdmin, productController.showAddProduct);
app.post(
  '/addProduct',
  checkAuthenticated,
  checkAdmin,
  productController.upload.single('image'),
  productController.handleAddProduct
);

app.get('/updateProduct/:id', checkAuthenticated, checkAdmin, productController.showUpdateProduct);
app.post(
  '/updateProduct/:id',
  checkAuthenticated,
  checkAdmin,
  productController.upload.single('image'),
  productController.handleUpdateProduct
);

app.get('/deleteProduct/:id', checkAuthenticated, checkAdmin, productController.handleDeleteProduct);

// Cart routes
app.post('/add-to-cart/:id', checkAuthenticated, cartController.addToCart);
app.get('/cart', checkAuthenticated, cartController.showCart);
app.post('/cart/update/:id', checkAuthenticated, cartController.updateCartItem);
app.post('/cart/delete/:id', checkAuthenticated, cartController.deleteCartItem);
app.get('/checkout', checkAuthenticated, cartController.showCheckout);
app.post('/checkout', checkAuthenticated, cartController.checkout);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
