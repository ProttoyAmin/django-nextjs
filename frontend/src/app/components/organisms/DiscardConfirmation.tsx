// src/app/components/organisms/DiscardConfirmation.tsx
import Button from "../atoms/Button";

interface DiscardConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DiscardConfirmation({ isOpen, onConfirm, onCancel }: DiscardConfirmationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-lg w-full max-w-md p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Discard post?</h3>
        <p className="text-gray-600 mb-6">
          If you leave, your changes won't be saved.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 cursor-pointer text-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <Button 
          name="Discard"
          onClick={onConfirm}
          variant="danger"
          type="button"
          size="squared"
          
          />
        </div>
      </div>
    </div>
  );
}