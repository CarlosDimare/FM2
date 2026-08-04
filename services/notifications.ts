const NOTIFICATION_KEY = 'fm_arg_notifications_enabled';

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const isNotificationEnabled = (): boolean => {
  return localStorage.getItem(NOTIFICATION_KEY) === 'true';
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === 'granted') {
    localStorage.setItem(NOTIFICATION_KEY, 'true');
    return true;
  }
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    localStorage.setItem(NOTIFICATION_KEY, 'true');
    return true;
  }
  return false;
};

export const sendNotification = (title: string, body: string, tag?: string): void => {
  if (!isNotificationEnabled() || !isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;
  const options: NotificationOptions = {
    body,
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: tag || 'fm-argentina',
    requireInteraction: false,
  };
  try {
    new Notification(title, options);
  } catch { /* ignore */ }
};

export const sendMatchNotification = (matchInfo: string): void => {
  sendNotification('FM Argentina — Partido', matchInfo, 'match');
};

export const sendInboxNotification = (subject: string): void => {
  sendNotification('FM Argentina — Nuevo mensaje', subject, 'inbox');
};

export const sendTransferNotification = (playerName: string, clubName: string): void => {
  sendNotification('FM Argentina — Traspaso', `${playerName} se une a ${clubName}`, 'transfer');
};

export const sendInjuryNotification = (playerName: string, injuryType: string, days: number): void => {
  sendNotification('FM Argentina — Lesión', `${playerName}: ${injuryType} (${days} días)`, 'injury');
};