import { useRef } from 'react';
import { useDialogFocus } from '../hooks/useDialogFocus';

interface ConfirmActionDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmClassName?: string;
  isBusy?: boolean;
  busyLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A generic "are you sure?" confirmation modal, styled to exactly match
 * the existing sign-out confirmation dialog (same overlay, card, and
 * button treatment) so it never looks like a bolted-on component.
 */
export function ConfirmActionDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  confirmClassName =
    'bg-[#2E8B75] hover:bg-[#257361] dark:bg-[#2E8B75] dark:hover:bg-[#257361]',
  isBusy = false,
  busyLabel = 'Saving…',
  onConfirm,
  onCancel,
}: ConfirmActionDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(true, dialogRef, () => {
    if (!isBusy) onCancel();
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F2024]/55 p-4 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) {
          onCancel();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-dialog-title"
        aria-describedby="confirm-action-dialog-description"
        tabIndex={-1}
        className="w-full max-w-sm rounded-2xl border border-[#EAE6DD] bg-white p-5 shadow-2xl dark:border-[#29484C] dark:bg-[#183238]"
      >
        <h2
          id="confirm-action-dialog-title"
          className="text-lg font-bold text-[#2B2417] dark:text-[#E4EFED]"
        >
          {title}
        </h2>
        <p id="confirm-action-dialog-description" className="mt-2 text-sm leading-relaxed text-[#7B7468] dark:text-[#B2C5C3]">
          {description}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            data-dialog-initial-focus
            onClick={onCancel}
            disabled={isBusy}
            className="rounded-lg border border-[#EAE6DD] bg-white px-4 py-2 text-sm font-semibold text-[#2B2417] transition-colors hover:bg-[#FFF4DF] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#29484C] dark:bg-[#13282D] dark:text-[#E4EFED] dark:hover:bg-[#1D3B41]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-wait disabled:opacity-70 ${confirmClassName}`}
          >
            {isBusy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
