import { Request, Response } from 'express';
import { Notification } from '../models/Notification.js';

export async function getNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userRole = req.user?.role || 'EMPLOYEE';
    const userId = req.user?.userId;

    const query: any = {
      $or: [
        { recipientId: userId },
        { recipientRole: 'ALL' },
        { recipientRole: userRole }
      ]
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (id === 'all') {
      const userRole = req.user?.role || 'EMPLOYEE';
      const userId = req.user?.userId;

      await Notification.updateMany(
        {
          $or: [
            { recipientId: userId },
            { recipientRole: 'ALL' },
            { recipientRole: userRole }
          ]
        },
        { isRead: true }
      );
    } else {
      await Notification.findByIdAndUpdate(id, { isRead: true });
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

