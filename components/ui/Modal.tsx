"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import Button from "./Button";

type PanelProps = { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode };

/** The visible panel: title and close, scrolling content, then actions on the right. */
export function ModalPanel({ title, onClose, children, footer }: PanelProps) {
  return (
    <div className="flex max-h-[85dvh] flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-stroke-primary py-2 pr-2 pl-5">
        <h2 className="text-body font-semibold text-text-1">{title}</h2>
        <Button variant="text" icon={<X aria-hidden />} aria-label="Close" onClick={onClose} />
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 text-body text-text-1">{children}</div>
      {footer && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-stroke-primary px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>
      )}
    </div>
  );
}

/** A bottom sheet on phones and a centred 500px dialog from 768px, built on the browser's modal <dialog>:
 *  focus trap, Escape to close and screen-reader support come built in. Render it only while open. */
export default function Modal(props: PanelProps) {
  const ref = useRef<HTMLDialogElement>(null);

  // No cleanup: unmounting removes the dialog, which closes it. Closing it here would fire onClose and,
  // under React's double-run of effects in development, shut the dialog the moment it opens.
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={props.title}
      onClose={props.onClose}
      // A tap on the dimmed backdrop lands on the dialog itself.
      onClick={(event) => event.target === ref.current && props.onClose()}
      className="mx-0 mt-auto mb-0 w-full max-w-none rounded-t-float bg-surface-1 p-0 text-text-1 shadow-popover backdrop:bg-(--modal-backdrop) md:m-auto md:w-[500px] md:rounded-float"
    >
      <ModalPanel {...props} />
    </dialog>
  );
}
