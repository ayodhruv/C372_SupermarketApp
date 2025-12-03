// controllers/productController.js
const multer = require('multer');
const Product = require('../models/Product');

// Multer config for product images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

exports.upload = multer({ storage });

const buildFilters = (query) => {
  const { q, minPrice, maxPrice } = query;
  const filters = {
    term: q && q.trim() ? q.trim() : null,
    minPrice: minPrice ? parseFloat(minPrice) : NaN,
    maxPrice: maxPrice ? parseFloat(maxPrice) : NaN
  };
  return filters;
};

// Admin inventory list (with optional filters)
exports.showInventory = (req, res) => {
  const filters = buildFilters(req.query);
  const hasFilters = filters.term || !isNaN(filters.minPrice) || !isNaN(filters.maxPrice);

  const handleResult = (err, products) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error loading inventory');
    }
    res.render('inventory', { products, user: req.session.user, filters });
  };

  if (hasFilters) {
    Product.search(filters, handleResult);
  } else {
    Product.getAll(handleResult);
  }
};

// User shopping page (with optional filters)
exports.showShopping = (req, res) => {
  const filters = buildFilters(req.query);
  const hasFilters = filters.term || !isNaN(filters.minPrice) || !isNaN(filters.maxPrice);

  const handleResult = (err, products) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error loading shopping page');
    }
    res.render('shopping', { user: req.session.user, products, filters });
  };

  if (hasFilters) {
    Product.search(filters, handleResult);
  } else {
    Product.getAll(handleResult);
  }
};

// Single product page
exports.showProductDetail = (req, res) => {
  const productId = req.params.id;
  Product.getById(productId, (err, product) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error loading product');
    }
    if (!product) return res.status(404).send('Product not found');
    res.render('product', { product, user: req.session.user });
  });
};

exports.showAddProduct = (req, res) => {
  res.render('addProduct', { user: req.session.user });
};

exports.handleAddProduct = (req, res) => {
  const { name, quantity, price } = req.body;
  const image = req.file ? req.file.filename : null;

  Product.create({ name, quantity, price, image }, (err) => {
    if (err) {
      console.error('Error adding product:', err);
      return res.status(500).send('Error adding product');
    }
    res.redirect('/inventory');
  });
};

exports.showUpdateProduct = (req, res) => {
  const id = req.params.id;
  Product.getById(id, (err, product) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error loading product');
    }
    if (!product) return res.status(404).send('Product not found');
    res.render('updateProduct', { product, user: req.session.user });
  });
};

exports.handleUpdateProduct = (req, res) => {
  const id = req.params.id;
  const { name, quantity, price, currentImage } = req.body;
  let image = currentImage;

  if (req.file) {
    image = req.file.filename;
  }

  Product.update(id, { name, quantity, price, image }, (err) => {
    if (err) {
      console.error('Error updating product:', err);
      return res.status(500).send('Error updating product');
    }
    res.redirect('/inventory');
  });
};

exports.handleDeleteProduct = (req, res) => {
  const id = req.params.id;
  Product.delete(id, (err) => {
    if (err) {
      console.error('Error deleting product:', err);
      return res.status(500).send('Error deleting product');
    }
    res.redirect('/inventory');
  });
};
