import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

export const useSuccessNotification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showDelete } = useNotification();
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const success = searchParams.get('success');

    if (!success) return;

    // Prevent processing the same success parameter multiple times
    if (processedRef.current === success) return;
    processedRef.current = success;

    let title = '';
    let message = '';

    switch (success) {
      case 'project-created':
        title = 'Project created successfully!';
        message = 'Your new project has been added and is ready for deployments.';
        break;
      case 'deployment-created':
        title = 'Deployment added successfully!';
        message = 'Your deployment has been recorded and is now being tracked.';
        break;
      case 'project-group-created':
        title = 'Project group created successfully!';
        message = 'Your new project group has been created and is ready to organize projects.';
        break;
      case 'project-updated':
        title = 'Project updated successfully!';
        message = 'Your project changes have been saved.';
        break;
      case 'deployment-updated':
        title = 'Deployment updated successfully!';
        message = 'Your deployment changes have been saved.';
        break;
      case 'project-group-updated':
        title = 'Project group updated successfully!';
        message = 'Your project group changes have been saved.';
        break;
      case 'project-deleted':
        title = 'Project deleted successfully!';
        message = 'The project has been permanently removed from the system.';
        break;
      case 'deployment-deleted':
        title = 'Deployment deleted successfully!';
        message = 'The deployment record has been permanently removed.';
        break;
      case 'project-group-deleted':
        title = 'Project group deleted successfully!';
        message = 'The project group has been permanently removed from the system.';
        break;
      default:
        title = 'Operation completed successfully!';
        message = 'Your action has been completed.';
    }

    // Use showDelete for delete operations, showSuccess for create/update operations
    if (success.includes('deleted')) {
      showDelete(title, message);
    } else {
      showSuccess(title, message);
    }

    // Remove the success parameter from URL without triggering a page reload
    const newSearchParams = new URLSearchParams(location.search);
    newSearchParams.delete('success');
    const newSearch = newSearchParams.toString();
    const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;

    navigate(newUrl, { replace: true });
  }, [location.search]); // Only depend on location.search, not the functions

  // Reset the processed ref when the pathname changes (navigating to a different page)
  useEffect(() => {
    processedRef.current = null;
  }, [location.pathname]);
};

export default useSuccessNotification;
