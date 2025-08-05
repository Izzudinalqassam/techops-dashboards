import React from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { useDatabaseConnectionContext } from '../../contexts/DatabaseConnectionContext';

interface DatabaseConnectionStatusProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DatabaseConnectionStatus: React.FC<DatabaseConnectionStatusProps> = ({
  showLabel = false,
  size = 'sm',
  className = '',
}) => {
  const { 
    isConnected, 
    isChecking, 
    lastError, 
    lastChecked, 
    retryCount,
    retry 
  } = useDatabaseConnectionContext();

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const getStatusInfo = () => {
    if (isChecking) {
      return {
        icon: RefreshCw,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        label: 'Checking connection...',
        animate: 'animate-spin',
      };
    }

    if (!isConnected) {
      return {
        icon: WifiOff,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        label: 'Database disconnected',
        animate: '',
      };
    }

    if (retryCount > 0) {
      return {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        label: 'Connection restored',
        animate: '',
      };
    }

    return {
      icon: Wifi,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      label: 'Database connected',
      animate: '',
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  const handleClick = () => {
    if (!isConnected && !isChecking) {
      retry();
    }
  };

  const formatLastChecked = () => {
    if (!lastChecked) return '';
    const now = new Date();
    const diff = now.getTime() - lastChecked.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ago`;
    }
    return `${seconds}s ago`;
  };

  return (
    <div 
      className={`flex items-center space-x-2 ${className}`}
      title={`Database status: ${statusInfo.label}${lastChecked ? ` (Last checked: ${formatLastChecked()})` : ''}`}
    >
      <div 
        className={`
          flex items-center justify-center rounded-full p-1
          ${statusInfo.bgColor}
          ${!isConnected && !isChecking ? 'cursor-pointer hover:opacity-80' : ''}
        `}
        onClick={handleClick}
        role={!isConnected && !isChecking ? 'button' : undefined}
        tabIndex={!isConnected && !isChecking ? 0 : undefined}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isConnected && !isChecking) {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={!isConnected && !isChecking ? 'Retry database connection' : statusInfo.label}
      >
        <Icon 
          className={`${sizeClasses[size]} ${statusInfo.color} ${statusInfo.animate}`}
          aria-hidden="true"
        />
      </div>
      
      {showLabel && (
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          {lastChecked && (
            <span className="text-xs text-gray-500">
              Last checked: {formatLastChecked()}
            </span>
          )}
          {lastError && !isConnected && (
            <span className="text-xs text-red-500 max-w-xs truncate">
              {lastError.message}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseConnectionStatus;
