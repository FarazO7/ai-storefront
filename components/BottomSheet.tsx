"use client";

import { useEffect, useRef, type ReactNode } from "react";

// The browser's own modal <dialog>: focus trap, Escape to close and screen-reader support come built in.
export default function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  // No cleanup: unmounting removes the dialog, which closes it. Closing it here would fire onClose
  // and, under React's double-run of effects in development, shut the sheet the moment it opens.
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      // A tap on the dimmed backdrop lands on the dialog itself.
      onClick={(e) => e.target === ref.current && onClose()}
      className="mx-0 mt-auto mb-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-2xl bg-white p-0 text-zinc-900 backdrop:bg-black/40"
    >
      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-11 items-center justify-center rounded-full text-xl text-zinc-500">
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
