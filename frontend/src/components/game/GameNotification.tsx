'use client';

import { useEffect } from 'react';
import { MdError, MdCheckCircle, MdInfo, MdWarning } from 'react-icons/md';
import styles from './GameNotification.module.css';

export type NotificationType = 'error' | 'success' | 'info' | 'warning';

interface GameNotificationProps {
  message: string;
  type?: NotificationType;
  duration?: number; // Auto-dismiss after this many milliseconds (0 = no auto-dismiss)
  onDismiss?: () => void;
}

export function GameNotification({ 
  message, 
  type = 'error', 
  duration = 5000,
  onDismiss 
}: GameNotificationProps) {
  useEffect(() => {
    if (duration > 0 && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <MdError className={styles.icon} />;
      case 'success':
        return <MdCheckCircle className={styles.icon} />;
      case 'warning':
        return <MdWarning className={styles.icon} />;
      case 'info':
        return <MdInfo className={styles.icon} />;
    }
  };

  return (
    <div className={`${styles.notification} ${styles[type]}`} role="alert">
      {getIcon()}
      <span className={styles.message}>{message}</span>
      {onDismiss && (
        <button 
          className={styles.closeButton}
          onClick={onDismiss}
          aria-label="Fechar notificação"
        >
          ×
        </button>
      )}
    </div>
  );
}

