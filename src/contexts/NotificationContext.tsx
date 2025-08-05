import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { NotificationProps } from "../components/ui/Notification";
import NotificationContainer from "../components/ui/NotificationContainer";

interface NotificationContextType {
  showNotification: (
    notification: Omit<NotificationProps, "id" | "onClose">
  ) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showDelete: (title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const generateId = useCallback(() => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const showNotification = useCallback(
    (notification: Omit<NotificationProps, "id" | "onClose">) => {
      // Check for duplicate notifications (same type, title, and message)
      setNotifications((prev) => {
        const isDuplicate = prev.some(
          (existing) =>
            existing.type === notification.type &&
            existing.title === notification.title &&
            existing.message === notification.message
        );

        if (isDuplicate) {
          return prev; // Don't add duplicate
        }

        const id = generateId();
        const newNotification: NotificationProps = {
          ...notification,
          id,
          onClose: removeNotification,
        };

        return [...prev, newNotification];
      });
    },
    [generateId, removeNotification]
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: "success", title, message });
    },
    [showNotification]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: "error", title, message });
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: "warning", title, message });
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: "info", title, message });
    },
    [showNotification]
  );

  const showDelete = useCallback(
    (title: string, message?: string) => {
      showNotification({ type: "delete", title, message });
    },
    [showNotification]
  );

  const value: NotificationContextType = useMemo(
    () => ({
      showNotification,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showDelete,
    }),
    [
      showNotification,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showDelete,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
