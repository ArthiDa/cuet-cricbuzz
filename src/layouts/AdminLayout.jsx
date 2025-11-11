import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { signOut } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navLinks = [
    { to: '/admin', icon: '📊', label: 'Dashboard' },
    { to: '/admin/matches', icon: '🏏', label: 'Matches' },
    { to: '/admin/teams', icon: '👥', label: 'Teams' },
    { to: '/admin/players', icon: '🎯', label: 'Players' },
    { to: '/admin/points-table', icon: '📈', label: 'Points Table' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Admin Header - Mobile Optimized */}
      <header className="bg-gray-900 text-white shadow-lg sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-800"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <Link to="/admin" className="flex items-center space-x-2 sm:space-x-3">
              <span className="text-2xl sm:text-3xl">🏏</span>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg sm:text-xl">CUET T10 Admin</h1>
                <p className="text-xs text-gray-400">Control Panel</p>
              </div>
              <div className="sm:hidden">
                <h1 className="font-bold text-base">Admin</h1>
              </div>
            </Link>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/" className="text-xs sm:text-sm hover:text-gray-300 hidden md:block">
                View Public Site
              </Link>
              {user && (
                <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-300">
                  <span className="text-lg">👤</span>
                  <span className="max-w-32 truncate">{user.email}</span>
                </div>
              )}
              <Button variant="danger" size="sm" onClick={handleLogout} className="text-xs sm:text-sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Sidebar & Content */}
      <div className="flex-grow flex relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Mobile Drawer & Desktop Fixed */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-white shadow-md
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          pt-14 sm:pt-16 lg:pt-0
        `}>
          <nav className="p-4 space-y-2">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={`
                  block px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700
                  ${link.to === '/admin' ? 'font-semibold' : ''}
                  transition-colors
                `}
              >
                <span className="text-lg">{link.icon}</span> {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content - Mobile Optimized */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

