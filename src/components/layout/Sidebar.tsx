import { Settings, Database, Key, Mic, LayoutDashboard, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/config', icon: Settings, label: 'Config' },
  { to: '/data', icon: Database, label: 'Data' },
  { to: '/credentials', icon: Key, label: 'Credentials' },
  { to: '/voice', icon: Mic, label: 'Voice Mode' },
];

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white flex flex-col z-50 border-r border-gray-200">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-black">
          Baap<span className="text-gray-500">Services</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 transition-all duration-200",
              "hover:bg-gray-100 hover:text-black"
            )}
            activeClassName="bg-gray-100 text-black font-medium"
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-black"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}