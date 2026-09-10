import { RefObject, useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useDialogFocus<T extends HTMLElement>(
  isOpen: boolean,
  containerRef: RefObject<T | null>,
  onClose: () => void,
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = (): HTMLElement[] =>
      Array.from(
        container.querySelectorAll(FOCUSABLE_SELECTOR) as NodeListOf<HTMLElement>,
      ).filter(
        (element: HTMLElement) => element.getAttribute('aria-hidden') !== 'true',
      );

    const initialTarget =
      container.querySelector<HTMLElement>('[data-dialog-initial-focus]')
      || focusableElements()[0]
      || container;

    initialTarget.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const elements = focusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [containerRef, isOpen]);
}
