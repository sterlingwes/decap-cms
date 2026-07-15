import type { TypeOptions } from 'react-toastify';

export interface NotificationMessage {
  details?: unknown;
  key: string;
  // Extra values are interpolated into the translated message (the notification
  // renderer spreads the whole message object as polyglot params), e.g. the
  // `%{count}` in a batch-published toast.
  [param: string]: unknown;
}

export interface NotificationPayload {
  message: string | NotificationMessage;
  dismissAfter?: number;
  type: TypeOptions | undefined;
}

export const NOTIFICATION_SEND = 'NOTIFICATION_SEND';
export const NOTIFICATION_DISMISS = 'NOTIFICATION_DISMISS';
export const NOTIFICATIONS_CLEAR = 'NOTIFICATION_CLEAR';

function addNotification(notification: NotificationPayload) {
  return { type: NOTIFICATION_SEND, payload: notification };
}

function dismissNotification(id: string) {
  return { type: NOTIFICATION_DISMISS, id };
}

function clearNotifications() {
  return { type: NOTIFICATIONS_CLEAR };
}

export type NotificationsAction = {
  type: typeof NOTIFICATION_DISMISS | typeof NOTIFICATION_SEND | typeof NOTIFICATIONS_CLEAR;
  payload?: NotificationPayload;
  id?: string;
};

export { addNotification, dismissNotification, clearNotifications };
