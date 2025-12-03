// controllers/notificationController.js

exports.listNotifications = (req, res) => {
  const notifications = req.session.notifications || [];
  res.render('notifications', {
    user: req.session.user,
    notifications
  });
};

exports.addNotification = (req, payload) => {
  if (!req.session) return;
  if (!Array.isArray(req.session.notifications)) {
    req.session.notifications = [];
  }
  req.session.notifications.unshift({
    id: Date.now(),
    ...payload,
    read: false,
    createdAt: new Date().toLocaleString()
  });
};

exports.markAllRead = (req, res) => {
  if (Array.isArray(req.session.notifications)) {
    req.session.notifications = req.session.notifications.map((n) => ({ ...n, read: true }));
  }
  res.redirect('/notifications');
};
