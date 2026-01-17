// src/app/components/organisms/ConfirmationModal.tsx
import Button from "../atoms/Button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "success";
}

export function Confirmation({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title, 
  message, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger"
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-lg w-full max-w-md p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 cursor-pointer text-gray-600 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <Button 
            name={confirmText}
            onClick={onConfirm}
            variant={variant}
            type="button"
            size="squared"
          />
        </div>
      </div>
    </div>
  );
}