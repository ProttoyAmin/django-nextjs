// src/hooks/useModal.ts
import { useState, useRef, useCallback, useEffect } from 'react';

export const useModal = (onClose?: () => void) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose?.();
    }
  }, [onClose]);

  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose?.();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [handleClickOutside, handleEscape]);

  return { modalRef };
};
