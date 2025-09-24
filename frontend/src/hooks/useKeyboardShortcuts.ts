import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsProps {
  onQuickSwitcher?: () => void;
  onFocusMessageInput?: () => void;
  onToggleMute?: () => void;
  onGoToChannel?: (direction: 'up' | 'down') => void;
  onEscape?: () => void;
}

export const useKeyboardShortcuts = ({
  onQuickSwitcher,
  onFocusMessageInput,
  onToggleMute,
  onGoToChannel,
  onEscape
}: KeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target as HTMLElement).contentEditable === 'true'
    ) {
      // Allow Escape to unfocus input
      if (event.key === 'Escape' && onEscape) {
        onEscape();
        (event.target as HTMLElement).blur();
      }
      return;
    }

    // Ctrl/Cmd + K: Quick channel switcher
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      onQuickSwitcher?.();
    }

    // Ctrl/Cmd + M: Toggle mute
    else if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
      event.preventDefault();
      onToggleMute?.();
    }

    // Alt + Up/Down: Navigate channels
    else if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      onGoToChannel?.(event.key === 'ArrowUp' ? 'up' : 'down');
    }

    // Tab or Enter: Focus message input
    else if (event.key === 'Tab' || (event.key === 'Enter' && !event.shiftKey)) {
      event.preventDefault();
      onFocusMessageInput?.();
    }

    // Escape: General escape handler
    else if (event.key === 'Escape') {
      onEscape?.();
    }
  }, [onQuickSwitcher, onFocusMessageInput, onToggleMute, onGoToChannel, onEscape]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return null;
};