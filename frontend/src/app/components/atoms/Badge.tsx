import React from 'react';
import './Badge.css';

interface BadgeProps {
    /** The text to display in the badge */
    text: string;
    /** The color of the dot (can be any valid CSS color) */
    color?: string;
    /** Additional CSS class names */
    className?: string;
    /** Size of the badge */
    size?: 'sm' | 'md' | 'lg';
}

const Badge: React.FC<BadgeProps> = ({
    text,
    color = '#3b82f6',
    className = '',
    size = 'md'
}) => {
    const sizeClasses = {
        sm: 'text-xs py-1 px-2',
        md: 'text-sm py-1.5 px-3',
        lg: 'text-base py-2 px-4'
    };

    const dotSizes = {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-2.5 h-2.5'
    };

    return (
        <div className={`badge ${sizeClasses[size]} ${className}`}>
            <span
                className={`badge-dot ${dotSizes[size]}`}
                style={{ backgroundColor: color ? color : '#383838' }}
            />
            <span className="badge-text">{text}</span>
        </div>
    );
};

export default Badge;