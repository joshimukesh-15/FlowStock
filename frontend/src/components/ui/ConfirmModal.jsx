import React, { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description, confirmText = "Confirm", cancelText = "Cancel", variant = "danger", isLoading: propLoading, }) => {
    const [internalLoading, setInternalLoading] = useState(false);
    const loading = propLoading !== undefined ? propLoading : internalLoading;
    const handleConfirm = async () => {
        try {
            setInternalLoading(true);
            await onConfirm();
        }
        finally {
            setInternalLoading(false);
        }
    };
    const isDanger = variant === "danger";
    const isWarning = variant === "warning";
    return (<Modal isOpen={isOpen} onClose={() => {
            if (!loading)
                onClose();
        }} maxWidth="sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDanger
            ? "bg-red-100 text-red-600"
            : isWarning
                ? "bg-amber-100 text-amber-600"
                : "bg-slate-100 text-slate-700"}`}>
            {isDanger ? (<AlertTriangle className="w-5 h-5"/>) : isWarning ? (<AlertCircle className="w-5 h-5"/>) : (<Info className="w-5 h-5"/>)}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          </div>
        </div>

        <div className="text-sm text-slate-600 mb-5 leading-relaxed">
          {description}
        </div>

        <div className="flex justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onClose}>
            {cancelText}
          </Button>
          <Button type="button" size="sm" isLoading={loading} onClick={handleConfirm} className={isDanger
            ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
            : ""}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>);
};
