import { Link, useLocation } from 'react-router';
import { BarChart3, Package, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from 'next-themes';
import { useState } from 'react';

export function Sidebar() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/', icon: BarChart3, label: '대시보드' },
    { path: '/products', icon: Package, label: '키워드 관리' },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 lg:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar border border-sidebar-border"
      >
        <BarChart3 className="h-5 w-5 text-sidebar-foreground" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-purple)] to-[var(--color-pink)]">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[var(--color-purple)] to-[var(--color-pink)] bg-clip-text text-transparent">
                PriceWatch
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Dark mode toggle */}
          <div className="border-t border-sidebar-border p-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-5 w-5" />
                  라이트 모드
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5" />
                  다크 모드
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}