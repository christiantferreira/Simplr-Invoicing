
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed top-16 left-0 h-full w-72 bg-simplr-primary border-r border-simplr-accent transform transition-transform duration-200 ease-in-out z-50',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="font-semibold text-simplr-on-dark">Menu</span>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-simplr-on-dark hover:bg-simplr-accent">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          <Link to="/invoices/new">
            <Button className="w-full btn-simplr hover:bg-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>

        <nav className="px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-simplr-accent text-simplr-primary border-r-2 border-simplr-accent'
                    : 'text-simplr-on-dark hover:text-simplr-primary hover:bg-simplr-accent'
                )}
                onClick={() => window.innerWidth < 1024 && onClose()}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
