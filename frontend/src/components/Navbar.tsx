import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { BoltIcon, ChatIcon, DashboardIcon, ShieldIcon, UserIcon, LogoutIcon, MenuIcon, XIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path: string) => pathname === path;

  const navLinks = user ? [
    { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { href: '/chat', label: 'Sznelk', icon: ChatIcon },
    { href: '/privacy', label: 'GDPR', icon: ShieldIcon },
  ] : [];

  return (
    <nav className="sticky top-0 z-50 glass glass-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-lg group-hover:bg-primary/30 transition-colors" />
              <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-lg">
                <BoltIcon size={20} className="text-primary-foreground" />
              </div>
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">
              Silesia <span className="text-primary">Akkka</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} to={href}>
                <Button
                  variant={isActive(href) ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`gap-2 ${isActive(href) ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Icon size={16} />
                  {label}
                </Button>
              </Link>
            ))}
          </div>

          {/* User Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <UserIcon size={14} className="text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">{user.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground gap-2"
                >
                  <LogoutIcon size={16} />
                  Wyloguj
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    Logowanie
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Rejestracja
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-border border-t"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} to={href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive(href) ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-3"
                  >
                    <Icon size={18} />
                    {label}
                  </Button>
                </Link>
              ))}
              {user ? (
                <Button
                  variant="ghost"
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full justify-start gap-3 text-muted-foreground"
                >
                  <LogoutIcon size={18} />
                  Wyloguj ({user.username})
                </Button>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Logowanie</Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Rejestracja</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
