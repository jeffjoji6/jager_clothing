import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingBag, User, LogOut, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"; // Import SheetDescription
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Cart } from "./Cart";
import { useAuth } from "@/contexts/AuthContext";
import { LiquidGlassSlider } from "./LiquidGlassSlider";
import { NotificationButton } from "@/components/NotificationButton";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useNotificationCount } from "@/hooks/useNotificationCount";

export const Header = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, refreshCount } = useNotificationCount();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleNotificationClick = () => {
    setMobileMenuOpen(false);
    setNotificationOpen(true);
    refreshCount();
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/10 supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile: Hamburger */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="p-0 -ml-2 hover:bg-transparent">
                    <div className="relative">
                      <Menu className="h-7 w-7" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-jager-red border-2 border-background" />
                      )}
                    </div>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[350px] bg-background border-r border-border p-0 flex flex-col h-full">
                  <SheetHeader className="px-6 py-6 border-b border-border">
                    <SheetTitle className="text-left font-heading uppercase text-xl text-jager-red flex items-center gap-2">
                      <img src="/jager_logo_v2.png" alt="Jäger" className="h-8 w-auto" />
                    </SheetTitle>
                    <SheetDescription className="text-left mt-2 font-medium">
                      {user ?
                        `Welcome back, ${user.user_metadata?.full_name ? user.user_metadata.full_name.split(' ')[0] : user.email?.split('@')[0]}`
                        : 'Custom Jerseys & Streetwear'}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">

                    {/* Main Navigation */}
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Menu</p>
                      <Link
                        to="/bulk-orders"
                        className="block text-2xl font-heading font-bold uppercase tracking-tight text-jager-red hover:opacity-80 transition-opacity"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Bulk & Team Orders
                      </Link>
                      <Link
                        to="/collection"
                        className="block text-2xl font-heading font-bold uppercase tracking-tight hover:text-jager-red transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Collection
                      </Link>
                    </div>

                    {/* Account Section */}
                    {user && (
                      <div className="space-y-4 pt-4 border-t border-border/50">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Account</p>
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 text-lg font-bold uppercase tracking-wide hover:text-jager-red transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <User className="h-5 w-5" />
                          Profile
                        </Link>
                        <Link
                          to="/orders"
                          className="flex items-center gap-3 text-lg font-bold uppercase tracking-wide hover:text-jager-red transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <ShoppingBag className="h-5 w-5" />
                          Orders
                        </Link>
                        <button
                          onClick={handleNotificationClick}
                          className="flex items-center gap-3 text-lg font-bold uppercase tracking-wide hover:text-jager-red transition-colors w-full text-left"
                        >
                          <div className="relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-jager-red text-white text-[10px] flex items-center justify-center font-bold leading-none pointer-events-none">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            )}
                          </div>
                          Notifications
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-6 border-t border-border mt-auto">
                    {user ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 h-12 font-bold uppercase tracking-wider"
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    ) : (
                      <Button
                        className="w-full h-12 bg-jager-red hover:bg-red-700 font-bold uppercase tracking-wider"
                        onClick={() => {
                          navigate("/login");
                          setMobileMenuOpen(false);
                        }}
                      >
                        Login / Sign Up
                      </Button>
                    )}
                  </div>

                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop: Logo Left */}
            <div className="hidden md:block">
              <Link to="/" className="flex items-center pl-6">
                <img src="/jager_logo_v2.png" alt="Jager Logo" className="h-10 w-auto" />
              </Link>
            </div>

            {/* Mobile: Center Logo */}
            <Link to="/" className="md:hidden absolute left-1/2 transform -translate-x-1/2 flex items-center">
              <img src="/jager_logo_v2.png" alt="Jager Logo" className="h-9 w-auto" />
            </Link>

            {/* Desktop: Center Navigation */}
            <div className="hidden md:block">
              <LiquidGlassSlider />
            </div>

            {/* Right: Icons */}
            <div className="flex items-center gap-4">
              {loading ? (
                <div className="w-5 h-5 hidden md:block" />
              ) : user ? (
                <>
                  <div className="hidden md:block">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="p-0 hover:bg-grey-bg">
                          <User className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 p-2">
                        <div className="px-3 py-2.5 border-b mb-1">
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Signed in as</p>
                          <p className="text-sm font-bold truncate text-foreground">{user.email}</p>
                        </div>
                        <DropdownMenuItem asChild className="p-3 cursor-pointer focus:bg-muted">
                          <Link to="/profile" className="flex items-center gap-3">
                            <User className="h-4 w-4" />
                            <span className="font-heading font-bold uppercase text-sm">Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="p-3 cursor-pointer focus:bg-muted">
                          <Link to="/orders" className="flex items-center gap-3">
                            <ShoppingBag className="h-4 w-4" />
                            <span className="font-heading font-bold uppercase text-sm">My Orders</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem onClick={handleSignOut} className="p-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span className="font-heading font-bold uppercase text-sm">Sign Out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {/* Notification Button - Hidden on Mobile, shown on Desktop */}
                  <div className="hidden md:block">
                    <NotificationButton />
                  </div>
                </>
              ) : (
                <Link to="/login" className="hidden md:block">
                  <span className="text-sm font-heading font-bold uppercase tracking-wide hover:text-jager-red transition-colors cursor-pointer">
                    LOGIN/SIGNUP
                  </span>
                </Link>
              )}

              {/* Cart - Always Visible */}
              <Cart />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Notification Center Logic */}
      <NotificationCenter
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        onUpdate={refreshCount}
      />
    </>
  );
};
