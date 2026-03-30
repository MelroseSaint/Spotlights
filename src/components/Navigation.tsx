"use client";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Search, 
  PlusSquare, 
  Flame, 
  Bell,
  CreditCard,
  LayoutDashboard,
  Radio,
  Calendar,
  User,
  Menu,
  X,
  Zap,
  ChevronRight,
  Shield,
  Crown,
  Settings,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useUser, useUnreadCount } from "@/hooks/api";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const mainNavItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Discovery", path: "/discovery", icon: Search },
  { label: "Fresh Faces", path: "/fresh-faces", icon: Radio },
  { label: "Events", path: "/events", icon: Calendar },
  { label: "Pulse", path: "/pulse", icon: Flame },
  { label: "Messages", path: "/messages", icon: MessageSquare, userOnly: true },
  { label: "Settings", path: "/settings", icon: Settings, userOnly: true },
];

const userNavItems = [
  { label: "Upload", path: "/upload", icon: PlusSquare },
  { label: "Subscriptions", path: "/subscriptions", icon: CreditCard },
];

const isMonroeEmail = (email?: string) => {
  return email === "monroedoses@gmail.com";
};

export default function Navigation() {
  const location = useLocation();
  const { user, lightCredz, isLoading } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const setupRootAdmin = useMutation(api.backend.users.setupRootAdmin);
  const unreadCountData = useUnreadCount(user?._id);

  const unreadCount = unreadCountData?.count ?? 0;

  const handleSetupAdmin = async () => {
    if (!user?._id) {
      toast.error("Please sign in first");
      return;
    }
    toast.info("Setting up admin...");
    try {
      console.log("1. Starting admin setup for:", user._id);
      const mutationFn = setupRootAdmin;
      console.log("2. Mutation function:", mutationFn);
      const result = await mutationFn({ userId: user._id as any });
      console.log("3. Result:", JSON.stringify(result));
      toast.success("Root Admin privileges activated!");
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      console.error("4. Admin setup error:", error);
      toast.error(error.message || "Failed to setup admin: " + (error.message || "Unknown error"));
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const isAdmin = user?.role === "root_admin" || user?.role === "admin" || isMonroeEmail(user?.email);
  const showAdmin = isAdmin;

  const navItems = [
    ...mainNavItems.filter(item => !item.userOnly || (!!user)),
    ...userNavItems,
    ...(showAdmin ? [{ label: "Admin Panel", path: "/admin", icon: Shield as any, adminOnly: true }] : []),
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800/50 bg-zinc-950/50 backdrop-blur-xl fixed left-0 top-0 h-screen z-40">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/20">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-white">
              InTha<span className="text-amber-500">Spotlight</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 py-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive(item.path)
                  ? "bg-amber-500/10 text-amber-500 shadow-md"
                  : item.adminOnly
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive(item.path) ? "" : "group-hover:scale-110 transition-transform"
              )} />
              <span className="font-medium">{item.label}</span>
              {isActive(item.path) && (
                <ChevronRight className="w-4 h-4 ml-auto" />
              )}
            </Link>
          ))}
        </nav>

        {user && (
          <div className="p-4 border-t border-zinc-800/50 space-y-2">
            {isMonroeEmail(user.email) && user.role !== "root_admin" && (
              <button
                onClick={handleSetupAdmin}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-colors group"
              >
                <Crown className="w-5 h-5" />
                <span className="text-sm font-bold">Activate Admin</span>
              </button>
            )}
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800/50 transition-colors group text-zinc-400 hover:text-white"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
            <Link
              to={`/profile/${user._id}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-purple-500 overflow-hidden flex items-center justify-center">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">{user.name?.charAt(0) || "?"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span className="text-xs text-amber-500 font-bold">
                    {lightCredz?.balance ?? 0} LC
                  </span>
                </div>
              </div>
              <User className="w-4 h-4 text-zinc-500" />
            </Link>
          </div>
        )}

        {!user && !isLoading && (
          <div className="p-4 border-t border-zinc-800/50">
            <Link to="/signup">
              <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl">
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight text-white">
            ITS
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <Link to="/pulse" className="relative p-2 rounded-xl hover:bg-zinc-800/50 transition-colors">
              <Bell className="w-5 h-5 text-zinc-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-950 text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85%] bg-zinc-950 border-zinc-800 p-0">
              <div className="p-6 border-b border-zinc-800/50">
                <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-black text-xl tracking-tight text-white">
                    InTha<span className="text-amber-500">Spotlight</span>
                  </span>
                </Link>
              </div>
              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-4 rounded-xl transition-all",
                      isActive(item.path)
                        ? "bg-amber-500/10 text-amber-500"
                        : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
                {user ? (
                  <Link
                    to={`/profile/${user._id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-4 rounded-xl transition-all border-t border-zinc-800/50 mt-4 pt-4",
                      isActive("/profile") || isActive(`/profile/${user._id}`)
                        ? "bg-amber-500/10 text-amber-500"
                        : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                    )}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">My Profile</span>
                  </Link>
                ) : (
                  <Link
                    to="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-4 rounded-xl bg-amber-500 text-black font-bold mt-4"
                  >
                    Sign Up
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/50 px-4 py-2 flex justify-between items-center z-50">
          <Link 
            to="/" 
            className={cn(
              "p-3 rounded-xl transition-all",
              isActive("/") ? "text-amber-500 bg-amber-500/10" : "text-zinc-500"
            )}
          >
            <Home className="w-6 h-6" />
          </Link>
          <Link 
            to="/discovery" 
            className={cn(
              "p-3 rounded-xl transition-all",
              isActive("/discovery") ? "text-amber-500 bg-amber-500/10" : "text-zinc-500"
            )}
          >
            <Search className="w-6 h-6" />
          </Link>
          <div className="relative -mt-6">
            <Link 
              to="/upload" 
              className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 border-4 border-zinc-950 transform active:scale-95 transition-transform"
            >
              <PlusSquare className="w-7 h-7" />
            </Link>
          </div>
          <Link 
            to="/fresh-faces" 
            className={cn(
              "p-3 rounded-xl transition-all",
              isActive("/fresh-faces") ? "text-amber-500 bg-amber-500/10" : "text-zinc-500"
            )}
          >
            <Radio className="w-6 h-6" />
          </Link>
          <Link 
            to={`/profile/${user._id}`} 
            className={cn(
              "p-3 rounded-xl transition-all",
              isActive(`/profile/${user._id}`) ? "text-amber-500 bg-amber-500/10" : "text-zinc-500"
            )}
          >
            <User className="w-6 h-6" />
          </Link>
        </nav>
      )}
    </>
  );
}
