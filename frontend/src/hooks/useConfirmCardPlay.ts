import { useState, useEffect } from 'react';

const CONFIRM_CARD_PLAY_KEY = 'confirmCardPlay';

/**
 * Hook to manage the player's preference for confirming card plays
 * Stores preference in localStorage
 */
export function useConfirmCardPlay() {
  const [confirmCardPlay, setConfirmCardPlay] = useState<boolean>(() => {
    // Default to false (no confirmation)
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(CONFIRM_CARD_PLAY_KEY);
    return stored === 'true';
  });

  useEffect(() => {
    // Save to localStorage whenever preference changes
    localStorage.setItem(CONFIRM_CARD_PLAY_KEY, String(confirmCardPlay));
  }, [confirmCardPlay]);

  return [confirmCardPlay, setConfirmCardPlay] as const;
}
