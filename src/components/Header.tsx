import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingBag, User, LogOut, Search } from "lucide-react";
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

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/10 supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile: Hamburger */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="p-0 -ml-2 hover:bg-transparent">
                  <Menu className="h-7 w-7" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full bg-background p-0">
                <SheetHeader className="hidden">
                  <SheetTitle>Mobile Menu</SheetTitle>
                  <SheetDescription>Navigation menu</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
                  <Link
                    to="/collection"
                    className="text-4xl font-heading font-bold uppercase tracking-tight hover:text-jager-red transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    COLLECTION
                  </Link>
                  <Link
                    to="/custom-design"
                    className="text-4xl font-heading font-bold uppercase tracking-tight hover:text-jager-red transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    CUSTOM DESIGN
                  </Link>
                  {user ? (
                    <>
                      <Link
                        to="/profile"
                        className="text-2xl font-heading font-bold uppercase tracking-tight hover:text-jager-red transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        PROFILE
                      </Link>
                      <Link
                        to="/orders"
                        className="text-2xl font-heading font-bold uppercase tracking-tight hover:text-jager-red transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        ORDERS
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                        className="text-2xl font-heading font-bold uppercase tracking-tight hover:text-jager-red transition-colors"
                      >
                        SIGN OUT
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      className="text-2xl font-heading font-bold uppercase tracking-tight hover:text-jager-red transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      SIGN IN
                    </Link>
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
            {/* <Link to="/" className="flex items-center gap-3">
              <img src="/test.PNG" alt="Jager Logo" className="h-8 w-auto scale-150 pl-12" />
              
            </Link> */}
          </div>

          {/* Mobile: Center Logo */}
          <Link to="/" className="md:hidden absolute left-1/2 transform -translate-x-1/2 flex items-center">
            <img src="/jager_logo_v2.png" alt="Jager Logo" className="h-8 w-auto" />
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
            ) : (
              <Link to="/login" className="hidden md:block">
                <span className="text-sm font-heading font-bold uppercase tracking-wide hover:text-jager-red transition-colors cursor-pointer">
                  LOGIN/SIGNUP
                </span>
              </Link>
            )}
            {!user && (
              <Link to="/login" className="md:hidden">
                <User className="h-5 w-5" />
              </Link>
            )}
            <NotificationButton />
            <Cart />
          </div>
        </div>
      </div>
    </header>
  );
};
