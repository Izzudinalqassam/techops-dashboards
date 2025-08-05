import React from 'react';
import { Loader } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ComponentType<any>;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border-transparent',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 border-transparent',
  outline: 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 border-gray-300',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 border-transparent',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border-transparent'
};

const sizeStyles = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg'
};

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6'
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const isDisabled = disabled || loading;
  
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-md border
    focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
    ${fullWidth ? 'w-full' : ''}
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `;

  const iconClasses = iconSizes[size];
  const showLeftIcon = Icon && iconPosition === 'left' && !loading;
  const showRightIcon = Icon && iconPosition === 'right' && !loading;

  return (
    <button
      className={baseClasses}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Loader className={`${iconClasses} mr-2 animate-spin`} />
      )}
      
      {showLeftIcon && (
        <Icon className={`${iconClasses} ${children ? 'mr-2' : ''}`} />
      )}
      
      {children}
      
      {showRightIcon && (
        <Icon className={`${iconClasses} ${children ? 'ml-2' : ''}`} />
      )}
    </button>
  );
};

export default Button;
