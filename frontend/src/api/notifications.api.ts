import { apiClient } from './client';

export enum NotificationType {
  SUBMISSION_PENDING = 'SUBMISSION_PENDING',
  SUBMISSION_APPROVED = 'SUBMISSION_APPROVED',
  SUBMISSION_REJECTED = 'SUBMISSION_REJECTED',
  CALCULATION_COMPLETE = 'CALCULATION_COMPLETE',
  PERIOD_ACTIVATED = 'PERIOD_ACTIVATED',
  PERIOD_LOCKED = 'PERIOD_LOCKED',
  LOW_PERFORMANCE_ALERT = 'LOW_PERFORMANCE_ALERT',
  ASSIGNMENT_CREATED = 'ASSIGNMENT_CREATED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  relatedType?: string;
  relatedId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationQueryParams {
  type?: NotificationType;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedNotifications {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
  };
}

export const notificationsApi = {
  /** 获取通知列表 */
  getNotifications: async (params?: NotificationQueryParams): Promise<PaginatedNotifications> => {
    const res = await apiClient.get('/notifications', { params });
    return res.data;
  },

  /** 获取未读数量 */
  getUnreadCount: async (): Promise<{ count: number }> => {
    const res = await apiClient.get('/notifications/unread-count');
    return res.data;
  },

  /** 标记单个为已读 */
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  /** 标记全部为已读 */
  markAllAsRead: async (): Promise<{ count: number }> => {
    const res = await apiClient.post('/notifications/mark-all-read');
    return res.data;
  },

  /** 删除单个通知 */
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },

  /** 清除所有已读通知 */
  removeAllRead: async (): Promise<{ count: number }> => {
    const res = await apiClient.delete('/notifications');
    return res.data;
  },
};
