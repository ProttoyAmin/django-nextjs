// src/hooks/useDiscardConfirmation.ts
import { useState, useEffect } from 'react';

export const useDiscardConfirmation = (hasChanges: boolean, onConfirm: () => void) => {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleCloseAttempt = () => {
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      onConfirm();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    onConfirm();
  };

  const handleCancelDiscard = () => {
    setShowDiscardConfirm(false);
  };

  return {
    showDiscardConfirm,
    handleCloseAttempt,
    handleConfirmDiscard,
    handleCancelDiscard
  };
};