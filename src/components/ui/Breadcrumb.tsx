import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, Edit, Plus } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
  action?: {
    icon: React.ComponentType<any>;
    onClick: () => void;
    tooltip: string;
  };
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav className={`flex items-center space-x-2 text-sm mb-6 ${className}`} aria-label="Breadcrumb">
      <Link 
        to="/" 
        className="text-gray-500 hover:text-gray-700 transition-colors flex items-center"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center space-x-2">
            {item.href && !item.current ? (
              <Link 
                to={item.href}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={`${item.current ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {item.label}
              </span>
            )}
            
            {item.action && (
              <button
                onClick={item.action.onClick}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title={item.action.tooltip}
              >
                <item.action.icon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
};

// Hook to generate breadcrumbs based on current route
export const useBreadcrumbs = (): BreadcrumbItem[] => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [];
    
    if (pathSegments.length === 0) {
      return [{ label: 'Dashboard', current: true }];
    }
    
    // Handle different route patterns
    switch (pathSegments[0]) {
      case 'projects':
        breadcrumbs.push({ label: 'Projects', href: '/projects' });
        if (pathSegments[1] === 'edit' && pathSegments[2]) {
          breadcrumbs.push({ 
            label: `Edit Project`, 
            current: true,
            action: {
              icon: Edit,
              onClick: () => console.log('Edit project'),
              tooltip: 'Edit project details'
            }
          });
        }
        break;
        
      case 'deployments':
        breadcrumbs.push({ label: 'Deployments', href: '/deployments' });
        if (pathSegments[1] === 'edit' && pathSegments[2]) {
          breadcrumbs.push({ 
            label: `Edit Deployment`, 
            current: true,
            action: {
              icon: Edit,
              onClick: () => console.log('Edit deployment'),
              tooltip: 'Edit deployment details'
            }
          });
        } else if (pathSegments[1]) {
          breadcrumbs.push({ 
            label: `Deployment Details`, 
            current: true 
          });
        }
        break;
        
      case 'project-groups':
        breadcrumbs.push({ label: 'Project Groups', href: '/project-groups' });
        if (pathSegments[1] === 'new') {
          breadcrumbs.push({ 
            label: 'New Project Group', 
            current: true,
            action: {
              icon: Plus,
              onClick: () => console.log('Create project group'),
              tooltip: 'Create new project group'
            }
          });
        } else if (pathSegments[2] === 'edit') {
          breadcrumbs.push({ 
            label: `Edit Project Group`, 
            current: true,
            action: {
              icon: Edit,
              onClick: () => console.log('Edit project group'),
              tooltip: 'Edit project group details'
            }
          });
        }
        break;
        
      case 'add-project':
        breadcrumbs.push({ label: 'Projects', href: '/projects' });
        breadcrumbs.push({ 
          label: 'New Project', 
          current: true,
          action: {
            icon: Plus,
            onClick: () => console.log('Create project'),
            tooltip: 'Create new project'
          }
        });
        break;
        
      case 'add-deployment':
        breadcrumbs.push({ label: 'Deployments', href: '/deployments' });
        breadcrumbs.push({ 
          label: 'New Deployment', 
          current: true,
          action: {
            icon: Plus,
            onClick: () => console.log('Create deployment'),
            tooltip: 'Create new deployment'
          }
        });
        break;
        
      default:
        breadcrumbs.push({ label: pathSegments[0], current: true });
    }
    
    return breadcrumbs;
  };
  
  return generateBreadcrumbs();
};

export default Breadcrumb;