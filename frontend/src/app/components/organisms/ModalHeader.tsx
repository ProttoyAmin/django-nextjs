import { X } from "lucide-react";
import Button from "../atoms/Button";

// src/app/components/organisms/ModalHeader.tsx
interface ModalHeaderProps {
  title: string;
  onClose?: () => void;
  onDone?: () => void;
  type?: 'edit' | 'delete' | 'confirm' | 'default';
  className?: string;
  showClose?: boolean;
}

export function ModalHeader({
  title,
  onClose,
  onDone,
  type = 'default',
  className,
  showClose = true
}: ModalHeaderProps) {


  if (type === 'edit') {
    return (
      <>
        <div className={`flex items-center justify-between p-6 ${className}`}>
          <div>
            <Button
              variant="default"
              icon={<X />}
              onClick={onClose}
            />
          </div>
          <div>
            <h2 className={'text-lg font-semibold'}>{title}</h2>
          </div>
          <div>
            <Button
              name="Done"
              variant="default"
              onClick={onDone}
            />

          </div>
        </div>
      </>
    )
  }

     
  return (
    <div className={`flex items-center justify-between p-6 ${className}`}>
      <div className="">
        <h2 className={'text-lg font-semibold'}>{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        {showClose && (
          <Button
            variant="ghost"
            icon={<X />}
            onClick={onClose}
          />
        )}
      </div>
    </div>
  );
}