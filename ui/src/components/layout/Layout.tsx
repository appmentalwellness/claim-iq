import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Mock user data - replace with actual user data from auth context
  const mockUser = {
    name: 'John Doe',
    email: 'john.doe@claimiq.com',
    role: 'claims_reviewer'
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={mockUser} onLogout={handleLogout} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;