/**
 * Utility functions for sharing game invitations via WhatsApp and Telegram
 */

/**
 * Generates the full game URL
 */
export function getGameUrl(gameId: string): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return `${window.location.origin}/game/${gameId}`;
}

/**
 * Generates a WhatsApp share link with the game invitation message
 */
export function getWhatsAppShareLink(gameId: string): string {
  const gameUrl = getGameUrl(gameId);
  const message = encodeURIComponent(
    `🎮 Venha jogar Keep the Sequence comigo!\n\n` +
    `ID do jogo: ${gameId}\n` +
    `Entre aqui: ${gameUrl}`
  );
  return `https://wa.me/?text=${message}`;
}

/**
 * Generates a Telegram share link with the game invitation message
 */
export function getTelegramShareLink(gameId: string): string {
  const gameUrl = getGameUrl(gameId);
  const message = encodeURIComponent(
    `🎮 Venha jogar Keep the Sequence comigo!\n\n` +
    `ID do jogo: ${gameId}\n` +
    `Entre aqui: ${gameUrl}`
  );
  return `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${message}`;
}

/**
 * Opens WhatsApp share dialog in a new window/tab
 * Never redirects the current page - only opens in new window/tab
 */
export function shareViaWhatsApp(gameId: string): void {
  const gameUrl = getGameUrl(gameId);
  const message = `🎮 Venha jogar Keep the Sequence comigo!\n\nID do jogo: ${gameId}\nEntre aqui: ${gameUrl}`;
  
  // Try Web Share API first (works well on mobile)
  if (navigator.share) {
    navigator.share({
      title: 'Keep the Sequence',
      text: message,
      url: gameUrl,
    }).catch(() => {
      // User cancelled or share failed, fallback to WhatsApp link
      const link = getWhatsAppShareLink(gameId);
      window.open(link, '_blank', 'noopener,noreferrer');
    });
  } else {
    // Fallback to WhatsApp link in new window/tab
    const link = getWhatsAppShareLink(gameId);
    window.open(link, '_blank', 'noopener,noreferrer');
    // Never redirect current page - if popup is blocked, user can try again
  }
}

/**
 * Opens Telegram share dialog in a new window/tab
 * Never redirects the current page - only opens in new window/tab
 */
export function shareViaTelegram(gameId: string): void {
  const gameUrl = getGameUrl(gameId);
  const message = `🎮 Venha jogar Keep the Sequence comigo!\n\nID do jogo: ${gameId}\nEntre aqui: ${gameUrl}`;
  
  // Try Web Share API first (works well on mobile)
  if (navigator.share) {
    navigator.share({
      title: 'Keep the Sequence',
      text: message,
      url: gameUrl,
    }).catch(() => {
      // User cancelled or share failed, fallback to Telegram link
      const link = getTelegramShareLink(gameId);
      window.open(link, '_blank', 'noopener,noreferrer');
    });
  } else {
    // Fallback to Telegram link in new window/tab
    const link = getTelegramShareLink(gameId);
    window.open(link, '_blank', 'noopener,noreferrer');
    // Never redirect current page - if popup is blocked, user can try again
  }
}
