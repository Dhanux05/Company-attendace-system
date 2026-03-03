const Notification = require('../models/Notification');

const createNotification = async ({ user, type, title, message, meta = {} }) => {
  if (!user) return null;
  return Notification.create({ user, type, title, message, meta });
};

const createManyNotifications = async (users, data) => {
  if (!Array.isArray(users) || users.length === 0) return [];
  return Notification.insertMany(
    users.map((userId) => ({
      user: userId,
      type: data.type,
      title: data.title,
      message: data.message,
      meta: data.meta || {},
    }))
  );
};

module.exports = { createNotification, createManyNotifications };
