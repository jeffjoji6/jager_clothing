import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ShoppingBag, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                <div className="flex flex-col items-center justify-center min-h-screen space-y-12">
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
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop: Logo Left */}
          <div className="hidden md:block">
            <Link to="/" className="text-3xl font-heading font-bold uppercase tracking-tighter">
              JÄGER
            </Link>
          </div>

          {/* Mobile & Desktop: Center Logo */}
          <Link to="/" className="text-2xl md:hidden font-heading font-bold uppercase tracking-tighter absolute left-1/2 transform -translate-x-1/2">
            JÄGER
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
            <Button variant="ghost" size="icon" className="hidden md:flex p-0">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="p-0">
              <ShoppingBag className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
