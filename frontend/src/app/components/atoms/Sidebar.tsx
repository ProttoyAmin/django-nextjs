import React, { ReactNode } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  position?: 'left' | 'right';
  width?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  width = 'w-80'
}) => {
  const sidebarVariants: Variants = {
    open: { 
      x: position === 'right' ? 0 : '0',
      opacity: 1,
      transition: { 
        duration: 0.3,
      }
    },
    closed: { 
      x: position === 'right' ? '100%' : '-100%',
      opacity: 0,
      transition: { 
        duration: 0.3,
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className={`fixed top-0 ${position === 'right' ? 'right-0' : 'left-0'} h-full ${width} bg-black text-white z-50 shadow-xl flex flex-col`}
          >
            {title && (
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold">{title}</h2>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;