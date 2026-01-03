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
    `🎮 Venha jogar The Game comigo!\n\n` +
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
    `🎮 Venha jogar The Game comigo!\n\n` +
    `ID do jogo: ${gameId}\n` +
    `Entre aqui: ${gameUrl}`
  );
  return `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${message}`;
}

/**
 * Opens WhatsApp share dialog in a new window/tab
 */
export function shareViaWhatsApp(gameId: string): void {
  const link = getWhatsAppShareLink(gameId);
  // Open in new window/tab - this keeps the game page open
  const newWindow = window.open(link, '_blank', 'noopener,noreferrer');
  // If popup was blocked, try to open in same window as fallback
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    // Fallback: open in same window (shouldn't happen with user interaction)
    window.location.href = link;
  }
}

/**
 * Opens Telegram share dialog in a new window/tab
 */
export function shareViaTelegram(gameId: string): void {
  const link = getTelegramShareLink(gameId);
  // Open in new window/tab - this keeps the game page open
  const newWindow = window.open(link, '_blank', 'noopener,noreferrer');
  // If popup was blocked, try to open in same window as fallback
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    // Fallback: open in same window (shouldn't happen with user interaction)
    window.location.href = link;
  }
}
