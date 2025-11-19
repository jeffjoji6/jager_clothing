import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, User, ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="text-2xl font-heading font-bold tracking-widest">
              JÄGER
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/collection" className="text-sm font-medium hover:text-accent transition-colors">
                COLLECTION
              </Link>
              <Link to="/custom-lab" className="text-sm font-medium hover:text-accent transition-colors">
                CUSTOM LAB
              </Link>
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <User className="h-5 w-5" />
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">
                      0
                    </span>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex flex-col h-full">
                    <h2 className="text-xl font-heading mb-4">YOUR CART</h2>
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      Cart is empty
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full">
                  <nav className="flex flex-col gap-8 mt-12">
                    <Link
                      to="/collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-3xl font-heading hover:text-accent transition-colors"
                    >
                      COLLECTION
                    </Link>
                    <Link
                      to="/custom-lab"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-3xl font-heading hover:text-accent transition-colors"
                    >
                      CUSTOM LAB
                    </Link>
                    <div className="border-t border-border pt-8 flex gap-6">
                      <Button variant="ghost" size="icon">
                        <Search className="h-6 w-6" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <User className="h-6 w-6" />
                      </Button>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Scrolling Ticker */}
      <div className="bg-foreground text-background overflow-hidden">
        <div className="animate-marquee whitespace-nowrap py-2 text-xs font-medium tracking-wider">
          <span className="inline-block px-4">CHASE. CONQUER. CREATE.</span>
          <span className="inline-block px-4">+++</span>
          <span className="inline-block px-4">WORLDWIDE SHIPPING</span>
          <span className="inline-block px-4">+++</span>
          <span className="inline-block px-4">JÄGER CLOTHING</span>
          <span className="inline-block px-4">+++</span>
          <span className="inline-block px-4">CHASE. CONQUER. CREATE.</span>
          <span className="inline-block px-4">+++</span>
          <span className="inline-block px-4">WORLDWIDE SHIPPING</span>
          <span className="inline-block px-4">+++</span>
          <span className="inline-block px-4">JÄGER CLOTHING</span>
          <span className="inline-block px-4">+++</span>
        </div>
      </div>
    </>
  );
};
