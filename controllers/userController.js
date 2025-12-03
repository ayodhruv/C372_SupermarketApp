// controllers/userController.js
const User = require('../models/Users'); // matches Users.js
const notificationController = require('./notificationController');

exports.showRegister = (req, res) => {
  res.render('register', {
    messages: req.flash('error'),
    formData: req.flash('formData')[0] || {}
  });
};

exports.handleRegister = (req, res) => {
  const { username, email, password, address, contact, role } = req.body;

  if (!username || !email || !password || !address || !contact || !role) {
    req.flash('error', 'All fields are required.');
    req.flash('formData', req.body);
    return res.redirect('/register');
  }

  if (password.length < 6) {
    req.flash('error', 'Password should be at least 6 or more characters long');
    req.flash('formData', req.body);
    return res.redirect('/register');
  }

  User.create({ username, email, password, address, contact, role }, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error during registration');
    }
    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/login');
  });
};

exports.showLogin = (req, res) => {
  res.render('login', {
    messages: req.flash('success'),
    errors: req.flash('error')
  });
};

exports.handleLogin = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/login');
  }

  User.findByEmailAndPassword(email, password, (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error during login');
    }

    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    req.session.user = user;
    req.flash('success', 'Login successful!');

    if (user.role === 'user') {
      res.redirect('/shopping');
    } else {
      res.redirect('/inventory');
    }
  });
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};

// User: view/edit own profile
exports.showProfile = (req, res) => {
  res.render('profile', {
    user: req.session.user,
    messages: req.flash('error'),
    success: req.flash('success')
  });
};

exports.handleProfileUpdate = (req, res) => {
  const userId = req.session.user.id;
  const { username, email, address, contact } = req.body;

  if (!username || !email) {
    req.flash('error', 'Username and email are required.');
    return res.redirect('/profile');
  }

  // Keep existing role
  const role = req.session.user.role;

  User.update(userId, { username, email, address, contact, role }, (err) => {
    if (err) {
      console.error('Error updating profile:', err);
      req.flash('error', 'Error updating profile.');
      return res.redirect('/profile');
    }

    // Refresh session user data
    req.session.user = { ...req.session.user, username, email, address, contact, role };
    req.flash('success', 'Profile updated successfully.');

    notificationController.addNotification(req, {
      type: 'Profile Update',
      title: 'Profile updated',
      message: 'Your account details have been updated.',
      link: '/profile'
    });

    res.redirect('/profile');
  });
};

// Admin: view all users
exports.listUsers = (req, res) => {
  User.getAll((err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).send('Error loading users');
    }
    res.render('users', { users, user: req.session.user });
  });
};

// Admin: edit user form
exports.showEditUser = (req, res) => {
  const userId = req.params.id;
  const messages = req.flash('error');
  User.getById(userId, (err, targetUser) => {
    if (err) {
      console.error('Error loading user:', err);
      return res.status(500).send('Error loading user');
    }
    if (!targetUser) return res.status(404).send('User not found');
    res.render('userEdit', { targetUser, user: req.session.user, messages });
  });
};

// Admin: handle edit user
exports.handleEditUser = (req, res) => {
  const userId = req.params.id;
  const { username, email, address, contact, role } = req.body;

  if (!username || !email || !role) {
    req.flash('error', 'Username, email, and role are required.');
    return res.redirect(`/users/${userId}/edit`);
  }

  User.update(
    userId,
    { username, email, address, contact, role },
    (err) => {
      if (err) {
        console.error('Error updating user:', err);
        return res.status(500).send('Error updating user');
      }
      req.flash('success', 'User updated successfully');
      res.redirect('/users');
    }
  );
};
