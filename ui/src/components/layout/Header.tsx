import React from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Settings, Bell } from 'lucide-react';
import Button from '@/components/ui/Button';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-white border-b border-secondary-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Navigation */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CQ</span>
            </div>
            <span className="text-xl font-bold text-secondary-900">ClaimIQ</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/dashboard" 
              className="text-secondary-600 hover:text-secondary-900 font-medium"
            >
              Dashboard
            </Link>
            <Link 
              to="/claims" 
              className="text-secondary-600 hover:text-secondary-900 font-medium"
            >
              Claims
            </Link>
            <Link 
              to="/upload" 
              className="text-secondary-600 hover:text-secondary-900 font-medium"
            >
              Upload
            </Link>
            <Link 
              to="/reports" 
              className="text-secondary-600 hover:text-secondary-900 font-medium"
            >
              Reports
            </Link>
          </nav>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg">
            <Bell className="w-5 h-5" />
          </button>

          {/* User Profile */}
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-secondary-900">{user.name}</p>
                <p className="text-xs text-secondary-600 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg">
                  <User className="w-5 h-5" />
                </button>
                
                <button className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg">
                  <Settings className="w-5 h-5" />
                </button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="p-2"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;