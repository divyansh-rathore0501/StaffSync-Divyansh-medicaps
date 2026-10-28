import type { Response } from 'express';
import { db } from '../db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export const getMyNotifications = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const userId = req.user._id;
  const list = db.notifications.filter(n => {
    const rId = typeof n.recipient === 'object' && n.recipient ? n.recipient._id : n.recipient;
    return rId === userId;
  });

  list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  const unreadCount = list.filter(n => !n.isRead).length;

  res.json({
    success: true,
    notifications: list.slice(0, 30),
    unreadCount
  });
};

export const markAsRead = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { id } = req.body;
  const userId = req.user._id;

  if (id) {
    const notif = db.notifications.find(n => {
      const rId = typeof n.recipient === 'object' && n.recipient ? n.recipient._id : n.recipient;
      return n._id === id && rId === userId;
    });
    if (notif) notif.isRead = true;
  } else {
    // Mark all as read
    db.notifications.forEach(n => {
      const rId = typeof n.recipient === 'object' && n.recipient ? n.recipient._id : n.recipient;
      if (rId === userId) n.isRead = true;
    });
  }

  db.save();
  res.json({ success: true, message: 'Notifications updated.' });
};
