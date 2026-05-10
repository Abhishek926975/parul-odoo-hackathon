import { X } from "lucide-react";
import Button from "./Button";

export default function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-traveloop-midnight/50 p-4 sm:items-center">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-traveloop-border px-5 py-4">
          <h2 className="text-lg font-semibold text-traveloop-midnight">{title}</h2>
          <Button aria-label="Close modal" icon={<X size={18} />} onClick={onClose} variant="ghost" />
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer ? <div className="border-t border-traveloop-border px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
