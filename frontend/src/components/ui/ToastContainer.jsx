import { X } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const toneClasses = {
  success: "border-traveloop-success/30 bg-emerald-50 text-emerald-900",
  error: "border-traveloop-danger/30 bg-red-50 text-red-900",
  warning: "border-traveloop-sand/40 bg-amber-50 text-amber-900",
  info: "border-traveloop-sea/30 bg-sky-50 text-sky-900",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-card ${toneClasses[toast.type] || toneClasses.info}`}
        >
          <p className="font-medium">{toast.message}</p>
          <button aria-label="Dismiss notification" onClick={() => removeToast(toast.id)}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
