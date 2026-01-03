'use client';

import { Card } from './Card';
import styles from './ConfirmCardPlayModal.module.css';

interface ConfirmCardPlayModalProps {
  isOpen: boolean;
  card: { value: number; suit: string };
  pileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmCardPlayModal({
  isOpen,
  card,
  pileName,
  onConfirm,
  onCancel,
}: ConfirmCardPlayModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Confirmar Jogada</h3>
        <div className={styles.content}>
          <p className={styles.message}>
            Jogar esta carta na <strong>{pileName}</strong>?
          </p>
          <div className={styles.cardPreview}>
            <Card card={card} size="large" />
          </div>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className={styles.confirmButton}
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
