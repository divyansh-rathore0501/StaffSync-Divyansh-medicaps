import type { Response } from 'express';
import { db } from '../db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { IAnnouncement, AnnouncementCategory, INotification } from '../types.js';

export const getAnnouncements = (_req: AuthenticatedRequest, res: Response) => {
  const now = new Date().toISOString();

  // Filter out expired announcements
  const active = db.announcements.filter(a => !a.expiresAt || a.expiresAt >= now);
  active.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

  const populated = active.map(a => {
    const author = db.populateUser(a.author);
    return {
      ...a,
      author: author ? { _id: author._id, fullName: author.fullName, role: author.role } : a.author
    };
  });

  res.json({ success: true, count: populated.length, announcements: populated });
};

export const createAnnouncement = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { title, content, category = 'General', expiresAt } = req.body as {
    title: string;
    content: string;
    category: AnnouncementCategory;
    expiresAt?: string;
  };

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: 'Title and content are required.'
    });
  }

  const now = new Date().toISOString();
  const ann: IAnnouncement = {
    _id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    content: content.trim(),
    category,
    author: req.user._id,
    expiresAt: expiresAt || null,
    createdAt: now,
    updatedAt: now
  };

  db.announcements.unshift(ann);

  // Broadcast notification to all active users except author
  db.users.filter(u => u.status === 'Active' && u._id !== req.user!._id).forEach(u => {
    const notif: INotification = {
      _id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipient: u._id,
      title: `Company Announcement: ${ann.title}`,
      message: `${ann.content.substring(0, 90)}...`,
      type: 'System',
      isRead: false,
      linkUrl: '/announcements',
      createdAt: now,
      updatedAt: now
    };
    db.notifications.unshift(notif);
  });

  db.save();

  res.status(201).json({
    success: true,
    message: 'Announcement published and broadcast to active staff.',
    announcement: ann
  });
};

export const deleteAnnouncement = (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.announcements.findIndex(a => a._id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Announcement not found.' });
  }

  db.announcements.splice(index, 1);
  db.save();

  res.json({ success: true, message: 'Announcement deleted.' });
};
