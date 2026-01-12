import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"; // Import SheetDescription
import { ShoppingBag, X, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const Cart = () => {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = () => {
    // Check if user is logged in
    if (!authLoading && !user) {
      setOpen(false);
      toast.info("Please sign in to continue", {
        description: "You need to be logged in to checkout",
      });
      // Navigate to login with return path to checkout
      navigate("/login", { state: { from: { pathname: "/checkout" } } });
      return;
    }

    setOpen(false);
    navigate("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Cart">
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-jager-red text-white text-[10px] font-heading font-bold flex items-center justify-center leading-none pointer-events-none">
                {totalItems}
              </span>
            )}
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[90vw] sm:max-w-lg flex flex-col h-full">
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl uppercase tracking-tight">
            CART ({totalItems})
          </SheetTitle>
          <SheetDescription className="hidden">
            Review and manage items in your shopping cart
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingBag className="w-16 h-16 text-grey-text mb-4" />
            <p className="font-body text-grey-text">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-24 sm:w-24 sm:h-24 object-cover bg-grey-bg"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-heading text-sm uppercase font-bold">
                          {item.name}
                        </h3>
                        <p className="text-xs text-grey-text font-body">
                          Size: {item.size}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          removeItem(item.id, item.size).catch(console.error);
                        }}
                        className="text-grey-text hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 border border-foreground">
                        <button
                          onClick={() => {
                            updateQuantity(item.id, item.size, item.quantity - 1).catch(console.error);
                          }}
                          className="p-2 hover:bg-grey-bg"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-heading font-bold w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            updateQuantity(item.id, item.size, item.quantity + 1).catch(console.error);
                          }}
                          className="p-2 hover:bg-grey-bg"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-heading font-bold">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-foreground pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-heading text-lg uppercase font-bold">
                  TOTAL
                </span>
                <span className="font-heading text-2xl font-bold">
                  ₹{totalPrice.toLocaleString()}
                </span>
              </div>
              <Button variant="hero" size="lg" className="w-full" onClick={handleCheckout}>
                CHECKOUT
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
