import { useState, useRef, useEffect } from "react";
import { Menu, Settings, ChevronDown, X, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/WalletButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchDialog } from "@/components/SearchDialog";
import { NotificationsBell } from "@/components/NotificationsBell";
import { UserAccountMenu } from "@/components/account/UserAccountMenu";
import { ArenaEquityBadge } from "@/components/account/ArenaEquityBadge";
import { DepositModal } from "@/components/account/DepositModal";
import { ConsensusWidget } from "@/components/ConsensusWidget";
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { usePredifiWallet } from "@/contexts/PredifiWalletContext";
import { useTheme } from "@/providers/ThemeProvider";
import { brand, getThemedLogo } from "@/config/brand";
import { cn } from "@/lib/utils";

const Header = () => {
  const { isConnected } = useWallet();
  const { currentArenaWallet } = usePredifiWallet();
  const { theme, resolvedTheme } = useTheme();
  const location = useLocation();
  const [depositOpen, setDepositOpen] = useState(false);
  const [showArenaDropdown, setShowArenaDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileArenaExpanded, setMobileArenaExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const logo = getThemedLogo(theme, resolvedTheme);
  const isArenaActive = location.pathname.startsWith('/arena');

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowArenaDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileArenaExpanded(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity duration-150">
              <img src={logo} alt="Predifi" className="h-6" />
            </Link>
            
            {/* Main Nav - Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* Markets */}
              <Link 
                to="/markets"
                className={cn(
                  "relative h-9 px-4 text-xs uppercase tracking-wide transition-colors flex items-center",
                  location.pathname === '/markets' 
                    ? "text-warning" 
                    : "text-muted-foreground hover:text-warning"
                )}
              >
                Markets
                {/* Active indicator with glow */}
                <span className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-warning rounded-full transition-all duration-300",
                  location.pathname === '/markets' 
                    ? "w-6 opacity-100 shadow-[0_0_8px_2px_hsl(var(--warning)/0.6)]" 
                    : "w-0 opacity-0"
                )} />
              </Link>
              
              {/* Arena with Dropdown - Hover triggered with delay */}
              <div 
                className="relative" 
                ref={dropdownRef}
                onMouseEnter={() => {
                  if (dropdownTimeoutRef.current) {
                    clearTimeout(dropdownTimeoutRef.current);
                    dropdownTimeoutRef.current = null;
                  }
                  setShowArenaDropdown(true);
                }}
                onMouseLeave={() => {
                  dropdownTimeoutRef.current = setTimeout(() => {
                    setShowArenaDropdown(false);
                  }, 150); // 150ms delay before closing
                }}
              >
                <button 
                  className={cn(
                    "relative h-9 px-4 text-xs uppercase tracking-wide transition-colors flex items-center gap-1",
                    isArenaActive 
                      ? "text-warning" 
                      : "text-muted-foreground hover:text-warning"
                  )}
                >
                  Arena
                  <ChevronDown className={cn(
                    "w-3 h-3 transition-transform",
                    showArenaDropdown && "rotate-180"
                  )} />
                  {/* Active indicator with glow */}
                  <span className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-warning rounded-full transition-all duration-300",
                    isArenaActive 
                      ? "w-6 opacity-100 shadow-[0_0_8px_2px_hsl(var(--warning)/0.6)]" 
                      : "w-0 opacity-0"
                  )} />
                </button>
                
                {/* Dropdown */}
                {showArenaDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
                    <Link
                      to="/arena"
                      onClick={() => setShowArenaDropdown(false)}
                      className={cn(
                        "block px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors",
                        location.pathname === '/arena' 
                          ? "text-warning bg-muted/30" 
                          : "text-foreground"
                      )}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/arena/terminal"
                      onClick={() => setShowArenaDropdown(false)}
                      className={cn(
                        "block px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors",
                        location.pathname === '/arena/terminal' 
                          ? "text-warning bg-muted/30" 
                          : "text-foreground"
                      )}
                    >
                      Terminal
                    </Link>
                    <div className="border-t border-border" />
                    <Link
                      to="/arena/learn"
                      onClick={() => setShowArenaDropdown(false)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors",
                        location.pathname === '/arena/learn' 
                          ? "text-warning bg-muted/30" 
                          : "text-muted-foreground"
                      )}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Learn More
                    </Link>
                  </div>
                )}
              </div>

              {/* Vaults */}
              <Link 
                to="/earn"
                className={cn(
                  "relative h-9 px-4 text-xs uppercase tracking-wide transition-colors flex items-center",
                  location.pathname === '/earn' || location.pathname === '/vaults'
                    ? "text-warning" 
                    : "text-muted-foreground hover:text-warning"
                )}
              >
                Vaults
                {/* Active indicator with glow */}
                <span className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-warning rounded-full transition-all duration-300",
                  location.pathname === '/earn' || location.pathname === '/vaults'
                    ? "w-6 opacity-100 shadow-[0_0_8px_2px_hsl(var(--warning)/0.6)]" 
                    : "w-0 opacity-0"
                )} />
              </Link>

              {/* Leaderboard */}
              <Link 
                to="/leaderboard"
                className={cn(
                  "relative h-9 px-4 text-xs uppercase tracking-wide transition-colors flex items-center",
                  location.pathname === '/leaderboard'
                    ? "text-warning" 
                    : "text-muted-foreground hover:text-warning"
                )}
              >
                Leaderboard
                {/* Active indicator with glow */}
                <span className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-warning rounded-full transition-all duration-300",
                  location.pathname === '/leaderboard'
                    ? "w-6 opacity-100 shadow-[0_0_8px_2px_hsl(var(--warning)/0.6)]" 
                    : "w-0 opacity-0"
                )} />
              </Link>
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1">
            {/* Consensus Probability */}
            <ConsensusWidget />

            {/* Search */}
            <SearchDialog />

            {/* Notifications */}
            {isConnected && <NotificationsBell />}

            {/* Arena Equity Badge (if in competition) */}
            {isConnected && currentArenaWallet && (
              <ArenaEquityBadge compact onClick={() => setDepositOpen(true)} />
            )}

            {/* Deposit Button */}
            {isConnected && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs hidden sm:flex"
                onClick={() => setDepositOpen(true)}
              >
                Deposit
              </Button>
            )}

            {/* Settings - Hidden on mobile */}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-warning hidden sm:flex" asChild>
              <Link to="/settings">
                <Settings className="w-4 h-4" />
              </Link>
            </Button>

            {/* Theme Toggle - Hidden on mobile */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* User Account Menu or Wallet Connection */}
            {isConnected ? (
              <UserAccountMenu />
            ) : (
              <WalletButton />
            )}

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-8 w-8 text-muted-foreground hover:text-warning"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div 
        ref={mobileMenuRef}
        className={cn(
          "fixed top-14 right-0 w-72 h-[calc(100vh-3.5rem)] bg-background border-l border-border z-50 lg:hidden transition-transform duration-300 ease-out overflow-y-auto",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <nav className="p-4 space-y-1">
          {/* Markets */}
          <Link
            to="/markets"
            className={cn(
              "block px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              location.pathname === '/markets'
                ? "text-warning bg-warning/10"
                : "text-foreground hover:bg-muted"
            )}
          >
            Markets
          </Link>

          {/* Arena with Expandable Sub-menu */}
          <div>
            <button
              onClick={() => setMobileArenaExpanded(!mobileArenaExpanded)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isArenaActive
                  ? "text-warning bg-warning/10"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span>Arena</span>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                mobileArenaExpanded && "rotate-180"
              )} />
            </button>
            
            {/* Arena Sub-menu */}
            <div className={cn(
              "overflow-hidden transition-all duration-200",
              mobileArenaExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-4">
                <Link
                  to="/arena"
                  className={cn(
                    "block px-3 py-2 rounded-md text-sm transition-colors",
                    location.pathname === '/arena'
                      ? "text-warning bg-warning/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  Dashboard
                </Link>
                <Link
                  to="/arena/terminal"
                  className={cn(
                    "block px-3 py-2 rounded-md text-sm transition-colors",
                    location.pathname === '/arena/terminal'
                      ? "text-warning bg-warning/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  Terminal
                </Link>
                <Link
                  to="/arena/learn"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    location.pathname === '/arena/learn'
                      ? "text-warning bg-warning/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Learn More
                </Link>
              </div>
            </div>
          </div>

          {/* Vaults */}
          <Link
            to="/earn"
            className={cn(
              "block px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              location.pathname === '/earn' || location.pathname === '/vaults'
                ? "text-warning bg-warning/10"
                : "text-foreground hover:bg-muted"
            )}
          >
            Vaults
          </Link>

          {/* Leaderboard */}
          <Link
            to="/leaderboard"
            className={cn(
              "block px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              location.pathname === '/leaderboard'
                ? "text-warning bg-warning/10"
                : "text-foreground hover:bg-muted"
            )}
          >
            Leaderboard
          </Link>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Settings */}
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              location.pathname === '/settings'
                ? "text-warning bg-warning/10"
                : "text-foreground hover:bg-muted"
            )}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-foreground">Theme</span>
            <ThemeToggle />
          </div>

          {/* Deposit Button - Mobile */}
          {isConnected && (
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => {
                setDepositOpen(true);
                setMobileMenuOpen(false);
              }}
            >
              Deposit
            </Button>
          )}
        </nav>
      </div>

      {/* Deposit Modal */}
      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
    </header>
  );
};

export default Header;
