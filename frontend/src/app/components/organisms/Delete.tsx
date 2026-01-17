'use client';

import Button from "../atoms/Button";
import { Trash } from "lucide-react";


interface DeleteProps {
    name: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'default' | 'secondary' | 'danger' | 'ghostDanger';
    size?: 'default' | 'sm' | 'lg';
}

const Delete = ({ name, onClick, disabled, variant, size }: DeleteProps) => {
    return (
        <Button
            name={name}
            onClick={onClick}
            disabled={disabled}
            variant={variant}
            size={size}
            icon={<Trash size={20} />}
        />
    );
};

export default Delete;