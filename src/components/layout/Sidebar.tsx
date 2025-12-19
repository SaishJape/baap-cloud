import { useState, useEffect } from 'react';
import { Settings, Database, Key, Mic, LayoutDashboard, LogOut, ChevronDown, ChevronRight, Bot, MessageCircle, FileSpreadsheet, Send, Phone } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

interface NavItem {
  to: string;
  icon: any;
  label: string;
  end?: boolean;
}

interface NavSection {
  title?: string;
  icon?: any;
  items: NavItem[];
}

const navItems: NavSection[] = [
  {
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
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
  },
  {
    title: "WhatsApp",
    icon: MessageCircle,
    items: [
      { to: '/whatsapp', icon: LayoutDashboard, label: 'Overview', end: true },
      { to: '/whatsapp/templates', icon: FileSpreadsheet, label: 'Templates' },
      { to: '/whatsapp/campaigns', icon: Send, label: 'Campaigns' },
      { to: '/whatsapp/numbers', icon: Phone, label: 'Phone Numbers' },
    ]
  }
];

export function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  // Initialize state based on current path or default to Chatbot
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const isWhatsApp = location.pathname.startsWith('/whatsapp');
    return {
      'Chatbot': !isWhatsApp,
      'WhatsApp': isWhatsApp
    };
  });

  const toggleSection = (title: string) => {
    setOpenSections(prev => {
      // Create a new state with all sections closed
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        newState[key] = false;
      });

      // Toggle the clicked section
      // If it was closed (not in prev or false), set it to true.
      // If it was open (true), set it to false (toggle behavior).
      // However, usually accordions keep one open. 
      // If user clicks an open section, does it close? Yes, standard accordion.

      newState[title] = !prev[title];
      return newState;
    });
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
                        end={item.end}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-lg text-gray-500 transition-all duration-200 text-sm",
                          "hover:bg-primary/5 hover:text-primary"
                        )}
                        activeClassName="bg-primary/10 text-primary font-bold shadow-sm"
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
                  end={item.end}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 transition-all duration-200",
                    "hover:bg-primary/5 hover:text-primary"
                  )}
                  activeClassName="bg-primary/10 text-primary font-bold shadow-sm"
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