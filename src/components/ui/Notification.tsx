import React, { useEffect, useState } from "react";
import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from "lucide-react";

export interface NotificationProps {
  id: string;
  type: "success" | "error" | "warning" | "info" | "delete";
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(() => {
          onClose(id);
        }, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose, id]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-400" />;
      case "delete":
        return <CheckCircle className="h-5 w-5 text-red-400" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-400" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "border-l-4 shadow-lg";
    switch (type) {
      case "success":
        return `${baseStyles} bg-white border-green-400`;
      case "error":
        return `${baseStyles} bg-white border-red-400`;
      case "warning":
        return `${baseStyles} bg-white border-yellow-400`;
      case "info":
        return `${baseStyles} bg-white border-blue-400`;
      case "delete":
        return `${baseStyles} bg-white border-red-400`;
      default:
        return `${baseStyles} bg-white border-green-400`;
    }
  };

  return (
    <div
      className={`
        max-w-md w-full rounded-lg pointer-events-auto overflow-hidden
        transform transition-all duration-300 ease-in-out
        ${getStyles()}
        ${
          isVisible && !isLeaving
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-full opacity-0 scale-95"
        }
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            {message && (
              <div className="mt-1 text-sm text-gray-500">
                {message.split("\n").map((line, index) => (
                  <p key={index} className={index > 0 ? "mt-1" : ""}>
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
