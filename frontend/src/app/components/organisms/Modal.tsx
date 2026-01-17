// src/app/components/organisms/Modal.tsx
'use client'
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { XIcon } from 'lucide-react';
import Button from '../atoms/Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  page?: boolean;
  size?: 'sm' | 'sm_vertical' | 'md' | 'md_vertical' | 'lg' | 'lg_vertical' | 'xl' | '2xl' | 'auto'
  close?: boolean;
}

export function Modal({ isOpen, onClose, children, className, page = false, size = 'md', close = false }: ModalProps) {

  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscKey)

    return () => {
      window.removeEventListener('keydown', handleEscKey)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        if (page) {
          router.back();
        } else {
          onClose();
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (page) {
          router.back();
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [router]);


  if (!isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300 ${className}`}
      onClick={onClose}
    >
      {close && (
        <Button
          className="absolute z-60 top-4 right-4 text-white"
          onClick={() => { isOpen = false }}
          icon={<XIcon className="w-6 h-6" />}
          variant="default"
        />

      )}
      <div
        className={`relative bg-[#1f1f1f] rounded-lg shadow-2xl ${size === 'sm' ? 'w-1/4' : size === 'sm_vertical' ? 'w-1/4 h-[70vh]' : size === 'md' ? 'w-1/2 h-1/2' : size === 'md_vertical' ? 'w-1/3 h-11/12' : size === 'lg' ? 'w-5/7 h-[95vh]' : size === 'lg_vertical' ? 'w-5/9 h-6/7' : size === 'xl' ? 'w-6/7 h-6/7' : size === '2xl' ? 'w-full h-full' : size === 'auto' ? 'w-auto h-auto' : 'w-full h-full'} mx-4 max-h-[99vh] overflow-y-auto`}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}