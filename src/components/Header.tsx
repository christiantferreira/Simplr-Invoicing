
import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      window.location.href = '/';
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <header className="bg-simplr-primary border-b border-gray-200 h-16 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-40">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden text-simplr-on-dark hover:bg-simplr-accent"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-simplr-accent rounded-lg flex items-center justify-center">
            <span className="text-simplr-on-dark font-bold text-sm">S</span>
          </div>
          <h1 className="text-xl font-semibold text-simplr-on-dark">Simplr Invoicing</h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <ThemeToggle />
        
        <Button variant="ghost" size="icon" className="relative text-simplr-on-dark hover:bg-simplr-accent">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            2
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-simplr-on-dark hover:bg-simplr-accent">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white z-50">
            <div className="px-2 py-1.5 text-sm text-gray-700">
              {user?.email}
            </div>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
