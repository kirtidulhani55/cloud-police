import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface InfoTooltipProps {
  text: string;
  label?: string;
}

interface TooltipPosition {
  left: number;
  top: number;
  width: number;
  placement: 'above' | 'below';
}

const TOOLTIP_MAX_WIDTH = 288;
const VIEWPORT_GAP = 12;
const ICON_GAP = 8;
const ESTIMATED_HEIGHT = 96;

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  text,
  label = 'More information',
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const updatePosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const width = Math.min(
      TOOLTIP_MAX_WIDTH,
      Math.max(160, window.innerWidth - VIEWPORT_GAP * 2)
    );
    const idealLeft = rect.left + rect.width / 2 - width / 2;
    const left = Math.min(
      Math.max(VIEWPORT_GAP, idealLeft),
      window.innerWidth - width - VIEWPORT_GAP
    );
    const placement =
      rect.bottom + ICON_GAP + ESTIMATED_HEIGHT <= window.innerHeight
        ? 'below'
        : 'above';

    setPosition({
      left,
      top:
        placement === 'below'
          ? rect.bottom + ICON_GAP
          : rect.top - ICON_GAP,
      width,
      placement,
    });
  };

  const showTooltip = () => {
    updatePosition();
    setVisible(true);
  };

  const hideTooltip = () => setVisible(false);

  useEffect(() => {
    if (!visible) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideTooltip();
        buttonRef.current?.blur();
      }
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [visible]);

  return (
    <span className="relative inline-flex align-middle">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-describedby={visible ? tooltipId : undefined}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-[#A9A39A] bg-transparent text-[10px] font-bold leading-none text-[#7B7468] hover:border-[#2E8B75] hover:text-[#2E8B75] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E8B75]/50 dark:border-[#77736C] dark:text-[#AAA7A0] dark:hover:border-[#48B896] dark:hover:text-[#72D0B3]"
      >
        i
      </button>

      {visible && position &&
        createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            style={{
              left: position.left,
              top: position.top,
              width: position.width,
              transform:
                position.placement === 'above' ? 'translateY(-100%)' : undefined,
            }}
            className="pointer-events-none fixed z-[120] rounded-lg border border-[#D4E4E1] bg-white p-3 text-left text-xs font-normal leading-relaxed text-[#40565A] shadow-xl dark:border-[#394247] dark:bg-[#23282C] dark:text-[#C6CFD2]"
          >
            {text}
          </span>,
          document.body
        )}
    </span>
  );
};
