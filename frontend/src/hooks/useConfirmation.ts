// src/hooks/useConfirmation.ts
import { useState, useEffect } from 'react';

export const useConfirmation = (hasChanges: boolean, onConfirm: () => void) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleActionAttempt = () => {
    if (hasChanges) {
      setShowConfirm(true);
    } else {
      onConfirm();
    }
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onConfirm();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return {
    showConfirm,
    handleActionAttempt,
    handleConfirm,
    handleCancel
  };
};