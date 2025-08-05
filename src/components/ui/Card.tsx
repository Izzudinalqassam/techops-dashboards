import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const paddingConfig = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false, 
  padding = 'md',
  onClick 
}) => {
  const baseClasses = `
    bg-white rounded-xl shadow-sm border border-gray-200
    ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${paddingConfig[padding]}
    ${className}
  `;

  return (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>
    {children}
  </div>
);

export { Card, CardHeader, CardContent, CardFooter };
