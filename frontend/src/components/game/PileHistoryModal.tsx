'use client';

import { useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import styles from './PileHistoryModal.module.css';

interface PileHistoryModalProps {
  title: string;
  cards: Array<{ value: number; suit: string }>;
  isOpen: boolean;
  onClose: () => void;
}

export function PileHistoryModal({ title, cards, isOpen, onClose }: PileHistoryModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar"
          >
            <MdClose />
          </button>
        </div>
        <div className={styles.content}>
          {cards.length === 0 ? (
            <div className={styles.empty}>
              <p>Nenhuma carta jogada ainda</p>
            </div>
          ) : (
            <div className={styles.cardsList}>
              {cards.map((card, index) => (
                <div key={index} className={styles.cardItem}>
                  <span className={styles.cardNumber}>{card.value}</span>
                  {index < cards.length - 1 && <span className={styles.separator}>→</span>}
                </div>
              ))}
            </div>
          )}
          <div className={styles.footer}>
            <p className={styles.total}>Total: {cards.length} carta{cards.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

