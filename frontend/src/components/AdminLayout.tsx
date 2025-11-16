import React, { useEffect } from 'react';
import { useAuth } from '../AuthContext';
import type { Page } from '../types';

interface AdminLayoutProps {
  children: React.ReactNode;
  navigateTo: (page: Page) => void;
  page: Page;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, navigateTo, page }) => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigateTo('login');
    }
  }, [isAuthenticated, isLoading, navigateTo]);

  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen"><p>Đang tải...</p></div>;
  }
  
  const navLinks: { label: string; page: Page; requiredRole: 'staff' | 'admin' }[] = [
      { label: 'Tổng quan', page: 'admin-dashboard', requiredRole: 'staff' },
      { label: 'Đơn hàng', page: 'admin-orders', requiredRole: 'staff' },
      { label: 'Sản phẩm', page: 'admin-products', requiredRole: 'admin' },
  ];
  
  const visibleLinks = navLinks.filter(link => 
    user?.role === 'admin' || (user?.role === 'staff' && link.requiredRole === 'staff')
  );

  return (
    <div className="flex min-h-[calc(100vh-150px)]">
      <aside className="w-64 bg-gray-800 text-white flex flex-col p-4">
        <h2 className="font-bold text-xl mb-6 border-b border-gray-700 pb-4">Admin Panel</h2>
        <nav className="flex-grow">
          {visibleLinks.map(link => (
            <button
              key={link.page}
              onClick={() => navigateTo(link.page)}
              className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                page === link.page ? 'bg-luvin-pink text-gray-900' : 'hover:bg-gray-700'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>
        <div>
            <p className="text-xs text-gray-400 mb-2">Đăng nhập với: <strong>{user?.username}</strong> ({user?.role})</p>
            <button
              onClick={logout}
              className="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors bg-red-500 hover:bg-red-600"
            >
              Đăng xuất
            </button>
        </div>
      </aside>
      <main className="flex-grow bg-gray-100">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
