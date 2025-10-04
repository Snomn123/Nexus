import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = "💬",
  title,
  description,
  className = ""
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className="text-gray-400 text-lg mb-2">{icon}</div>
        <p className="text-gray-500">{title}</p>
        {description && (
          <p className="text-gray-600 text-sm mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};

export default EmptyState;