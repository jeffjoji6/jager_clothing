import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingBag, X, Minus, Plus } from "lucide-react";
import { useState } from "react";

export const Cart = () => {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative">
          <ShoppingBag className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-jager-red text-background text-xs font-heading font-bold flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl uppercase tracking-tight">
            CART ({totalItems})
          </SheetTitle>
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
                    className="w-24 h-24 object-cover bg-grey-bg"
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
                        onClick={() => removeItem(item.id, item.size)}
                        className="text-grey-text hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 border border-foreground">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.size, item.quantity - 1)
                          }
                          className="p-1 hover:bg-grey-bg"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-heading font-bold w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.size, item.quantity + 1)
                          }
                          className="p-1 hover:bg-grey-bg"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-heading font-bold">
                        ₹{(item.price * item.quantity).toFixed(2)}
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
                  ₹{totalPrice.toFixed(2)}
                </span>
              </div>
              <Button variant="hero" size="lg" className="w-full">
                CHECKOUT
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
