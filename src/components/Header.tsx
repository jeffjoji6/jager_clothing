import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingBag, Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Cart } from "./Cart";
import { useAuth } from "@/contexts/AuthContext";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-foreground">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile: Hamburger */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="p-0">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full bg-background p-0">
                <div className="flex flex-col items-center justify-center min-h-screen space-y-8">
                  <Link
                    to="/collection"
                    className="text-4xl font-heading font-bold uppercase tracking-tight hover:text-jager-red transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    COLLECTION
                  </Link>
                  <Link
                    to="/custom-lab"
                    className="text-4xl font-heading font-bold uppercase tracking-tight hover:text-jager-red transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    CUSTOM LAB
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
            <Link to="/" className="flex items-center gap-3 pl-6">
              <img src="/jager_logo.png" alt="Jager Logo" className="h-8 w-auto scale-150" />
              <span className="text-3xl font-heading font-semibold uppercase tracking-tighter">
                JÄGER
              </span>
            </Link>
            {/* <Link to="/" className="flex items-center gap-3">
              <img src="/test.PNG" alt="Jager Logo" className="h-8 w-auto scale-150 pl-12" />
              
            </Link> */}
          </div>

          {/* Mobile: Center Logo */}
          <Link to="/" className="text-2xl md:hidden font-heading font-bold uppercase tracking-tighter absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            <img src="/jager_logo.png" alt="Jager Logo" className="h-6 w-auto" />
            <span>JÄGER</span>
          </Link>

          {/* Desktop: Center Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/collection" className="text-sm font-heading font-bold uppercase tracking-wide hover:text-jager-red transition-colors">
              COLLECTION
            </Link>
            <span className="text-grey-text">|</span>
            <Link to="/custom-lab" className="text-sm font-heading font-bold uppercase tracking-wide hover:text-jager-red transition-colors">
              CUSTOM LAB
            </Link>
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hidden md:flex p-0">
              <Search className="h-5 w-5" />
            </Button>
            {loading ? (
              <div className="w-5 h-5 hidden md:block" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:flex p-0 hover:bg-grey-bg">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 border-b">
                    <p className="text-xs text-grey-text">Signed in as</p>
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="cursor-pointer">
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
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
            <Cart />
          </div>
        </div>
      </div>
    </header>
  );
};
