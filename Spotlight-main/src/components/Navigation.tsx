import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Compass, 
  Radio, 
  Upload, 
  Crown, 
  Settings, 
  LogOut, 
  Bell, 
  Menu, 
  X,
  Zap,
  User,
  Shield,
  ChevronDown
} from "lucide-react";
import { useUnreadNotificationCount } from "../../hooks/api/useNotifications";
import { useUserLightCredz } from "../../hooks/api/useUser";

interface NavigationProps {
  user?: {
    _id: string;
    name: string;
    email: string;
    username?: string;
    avatarUrl?: string;
    role: string;
    tier: string;
  } | null;
  onSignOut?: () => void;
}

export function Navigation({ user, onSignOut }: NavigationProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const unreadCount = useUnreadNotificationCount(user?._id || "");
  const lightCredz = useUserLightCredz(user?._id || "");
  
  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/discovery", icon: Compass, label: "Discovery" },
    { path: "/fresh-faces", icon: Radio, label: "Fresh Faces" },
    { path: "/events", icon: Radio, label: "Events" },
  ];
  
  const isActive = (path: string) => location.pathname === path;
  
  const isAdmin = user?.role === "root_admin" || user?.role === "admin" || user?.role === "moderator";
  const isRootAdmin = user?.role === "root_admin";
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Zap size={24} className="text-black" />
              </div>
              <span className="text-xl font-black text-white hidden sm:block italic">
                InTha<span className="text-amber-500">Spotlight</span>
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isActive(item.path)
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link 
                  to="/upload"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-bold transition-all"
                >
                  <Upload size={18} />
                  Upload
                </Link>
                
                <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 rounded-full">
                  <Zap size={14} className="text-amber-500" />
                  <span className="text-amber-500 font-bold text-sm">
                    {lightCredz?.balance ?? 0}
                  </span>
                </div>
                
                <Link 
                  to="/notifications"
                  className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Bell size={20} className="text-zinc-400" />
                  {unreadCount && unreadCount.count > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                      {unreadCount.count > 9 ? "9+" : unreadCount.count}
                    </span>
                  )}
                </Link>
                
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden flex items-center justify-center">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold">{user.name.charAt(0)}</span>
                      )}
                    </div>
                    <ChevronDown size={16} className="text-zinc-400 hidden sm:block" />
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                      <div className="p-4 border-b border-white/10">
                        <p className="font-bold text-white">{user.name}</p>
                        <p className="text-zinc-500 text-sm">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            user.tier === "elite" ? "bg-purple-500/20 text-purple-400" :
                            user.tier === "growth" ? "bg-amber-500/20 text-amber-500" :
                            "bg-zinc-700/50 text-zinc-400"
                          }`}>
                            {user.tier?.toUpperCase()}
                          </span>
                          {isRootAdmin && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 flex items-center gap-1">
                              <Shield size={10} />
                              ROOT
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-2">
                        <Link 
                          to={`/profile/${user._id}`}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User size={18} />
                          Profile
                        </Link>
                        <Link 
                          to="/subscriptions"
                          className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Crown size={18} />
                          Subscription
                        </Link>
                        <Link 
                          to="/settings"
                          className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings size={18} />
                          Settings
                        </Link>
                        
                        {isAdmin && (
                          <Link 
                            to="/admin"
                            className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg text-amber-500 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Shield size={18} />
                            Admin Panel
                          </Link>
                        )}
                        
                        <button
                          onClick={() => { setIsUserMenuOpen(false); onSignOut?.(); }}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg text-red-400 transition-colors"
                        >
                          <LogOut size={18} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/signin"
                  className="px-4 py-2 text-zinc-400 hover:text-white font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-bold transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-zinc-950">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-3 ${
                  isActive(item.path)
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
