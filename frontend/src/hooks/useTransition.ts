// hooks/useModalTransition.ts
import { useEffect, useState } from 'react';

export const useModalTransition = (onClose?: () => void) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation after component mounts
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setIsExiting(true);
    // Wait for exit animation before calling onClose
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  return {
    isVisible,
    isExiting,
    handleClose,
    modalOverlayClass: `modal-overlay ${isVisible ? 'modal-overlay-enter-active' : isExiting ? 'modal-overlay-exit-active' : 'modal-overlay-enter'}`,
    modalContentClass: `modal-content ${isVisible ? 'modal-content-enter-active' : isExiting ? 'modal-content-exit-active' : 'modal-content-enter'}`
  };
};