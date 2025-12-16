import { useState } from 'react';
import { Settings, Database, Key, Mic, LayoutDashboard, LogOut, ChevronDown, ChevronRight, Bot } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  {
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    title: 'Chatbot',
    icon: Bot,
    items: [
      { to: '/config', icon: Settings, label: 'Config' },
      { to: '/data', icon: Database, label: 'Data' },
      { to: '/credentials', icon: Key, label: 'Credentials' },
      { to: '/voice', icon: Mic, label: 'Voice Mode' },
    ]
  }
];

export function Sidebar() {
  const { logout } = useAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Chatbot': true
  });

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white flex flex-col z-50 border-r border-gray-200">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-black">
          Baap<span className="text-gray-500">Cloud</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navItems.map((section, index) => (
          <div key={index} className="space-y-1">
            {section.title ? (
              <>
                <button
                  onClick={() => toggleSection(section.title!)}
                  className={cn(
                    "flex items-center w-full gap-3 px-4 py-3 rounded-lg text-gray-600 transition-all duration-200",
                    "hover:bg-gray-100 hover:text-black"
                  )}
                >
                  {section.icon && <section.icon className="w-5 h-5" />}
                  <span className="flex-1 text-left font-medium">{section.title}</span>
                  {openSections[section.title] ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {openSections[section.title] && (
                  <div className="pl-4 space-y-1 mt-1">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-lg text-gray-500 transition-all duration-200 text-sm",
                          "hover:bg-gray-100 hover:text-black"
                        )}
                        activeClassName="bg-gray-100 text-black font-medium"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              section.items.map((item) => (
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
              ))
            )}
          </div>
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