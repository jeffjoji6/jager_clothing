import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { 
  useAddresses, 
  useCreateAddress, 
  useUpdateAddress, 
  useDeleteAddress,
  Address 
} from "@/hooks/useAddresses";
import { supabase } from "@/lib/supabase";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalPrice, clearCart, loading: cartLoading } = useCart();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    is_default: false,
  });

  const shippingCharge = totalPrice >= 2499 ? 0 : 99;
  const tax = Math.round(totalPrice * 0.18); // 18% GST
  const finalTotal = totalPrice + shippingCharge + tax;

  // Set default address when addresses load
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddress) {
      const defaultAddress = addresses.find(a => a.is_default) || addresses[0];
      if (defaultAddress) {
        setSelectedAddress(defaultAddress.id);
      }
    }
  }, [addresses, selectedAddress]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && items.length === 0) {
      navigate("/collection");
    }
  }, [items, cartLoading, navigate]);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await updateAddress.mutateAsync({
          id: editingAddress.id,
          type: 'shipping',
          ...newAddress,
        });
        toast.success("Address updated");
      } else {
        await createAddress.mutateAsync({
          type: 'shipping',
          ...newAddress,
        });
        toast.success("Address added");
      }
      setAddressDialogOpen(false);
      setEditingAddress(null);
      setNewAddress({
        full_name: "",
        street: "",
        city: "",
        state: "",
        zip: "",
        phone: "",
        is_default: false,
      });
    } catch (error: any) {
      toast.error("Failed to save address", { description: error.message });
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setNewAddress({
      full_name: address.full_name,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      phone: address.phone,
      is_default: address.is_default,
    });
    setAddressDialogOpen(true);
  };

  const handleDeleteAddress = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        await deleteAddress.mutateAsync(id);
        toast.success("Address deleted");
        if (selectedAddress === id) {
          setSelectedAddress("");
        }
      } catch (error: any) {
        toast.error("Failed to delete address", { description: error.message });
      }
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      navigate("/collection");
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a shipping address");
      return;
    }

    const address = addresses?.find(a => a.id === selectedAddress);
    if (!address) {
      toast.error("Please select a valid address");
      return;
    }

    setProcessingPayment(true);

    try {
      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          status: 'pending',
          total: finalTotal,
          subtotal: totalPrice,
          shipping: shippingCharge,
          tax: tax,
          shipping_address: {
            full_name: address.full_name,
            street: address.street,
            city: address.city,
            state: address.state,
            zip: address.zip,
            phone: address.phone,
          },
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_variant_id: item.variant_id || item.id,
        product_name: item.name,
        size: item.size,
        color: item.name.split(' - ')[2] || '',
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // TODO: Create Razorpay order on backend
      // For now, we'll simulate the payment flow
      // In production, you need to:
      // 1. Create a backend API endpoint to create Razorpay orders
      // 2. Call that endpoint here to get the order_id
      // 3. Then call openRazorpayCheckout with that order_id

      // Mock Razorpay order ID (replace with actual backend call)
      const mockRazorpayOrderId = `order_${order.id}`;

      // Open Razorpay checkout
      await openRazorpayCheckout(
        mockRazorpayOrderId,
        finalTotal,
        async (paymentResponse) => {
          // Update order with payment details
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'confirmed',
              payment_status: 'paid',
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            })
            .eq('id', order.id);

          if (updateError) {
            console.error('Failed to update order:', updateError);
          }

          // Clear cart
          await clearCart();

          // Redirect to order confirmation
          navigate(`/order-confirmation/${order.id}`);
        },
        (error) => {
          // Payment failed or cancelled
          setProcessingPayment(false);
          toast.error("Payment failed", { description: error.message });
          
          // Update order status to cancelled
          supabase
            .from('orders')
            .update({ status: 'cancelled', payment_status: 'failed' })
            .eq('id', order.id);
        },
        {
          name: address.full_name,
          email: user?.email || '',
          contact: address.phone,
        }
      );
    } catch (error: any) {
      setProcessingPayment(false);
      toast.error("Failed to place order", { description: error.message });
    }
  };

  if (cartLoading || addressesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8 md:py-12">
          <h1 className="text-3xl md:text-5xl font-heading font-bold uppercase tracking-tight mb-8">
            CHECKOUT
          </h1>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column - Order Details */}
            <div className="md:col-span-2 space-y-8">
              {/* Shipping Address */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-heading font-bold uppercase">SHIPPING ADDRESS</h2>
                  <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingAddress(null);
                          setNewAddress({
                            full_name: "",
                            street: "",
                            city: "",
                            state: "",
                            zip: "",
                            phone: "",
                            is_default: false,
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddressSubmit} className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="full_name">Full Name *</Label>
                          <Input
                            id="full_name"
                            value={newAddress.full_name}
                            onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="street">Street Address *</Label>
                          <Input
                            id="street"
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city">City *</Label>
                            <Input
                              id="city"
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="state">State *</Label>
                            <Input
                              id="state"
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="zip">ZIP Code *</Label>
                            <Input
                              id="zip"
                              value={newAddress.zip}
                              onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone *</Label>
                            <Input
                              id="phone"
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_default"
                            checked={newAddress.is_default}
                            onCheckedChange={(checked) => 
                              setNewAddress({ ...newAddress, is_default: checked as boolean })
                            }
                          />
                          <Label htmlFor="is_default" className="cursor-pointer">
                            Set as default address
                          </Label>
                        </div>
                        <div className="flex gap-4">
                          <Button type="submit" className="flex-1" disabled={createAddress.isPending || updateAddress.isPending}>
                            {createAddress.isPending || updateAddress.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              editingAddress ? "Update" : "Add"
                            )}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setAddressDialogOpen(false);
                              setEditingAddress(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                  <div className="space-y-3">
                    {addresses && addresses.length > 0 ? (
                      addresses.map((address) => (
                        <div key={address.id} className="flex items-start gap-3 border border-foreground p-4">
                          <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                          <label htmlFor={address.id} className="flex-1 cursor-pointer">
                            <div>
                              <p className="font-heading font-bold uppercase">{address.full_name}</p>
                              <p className="text-sm text-grey-text font-body">
                                {address.street}, {address.city}, {address.state} {address.zip}
                              </p>
                              <p className="text-sm text-grey-text font-body">Phone: {address.phone}</p>
                            </div>
                          </label>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAddress(address)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="border border-foreground p-6 text-center">
                        <p className="text-grey-text text-sm mb-4">No addresses saved. Please add an address to continue.</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setAddressDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Address
                        </Button>
                      </div>
                    )}
                  </div>
                </RadioGroup>
              </div>

              {/* Order Items Summary */}
              <div>
                <h2 className="text-xl font-heading font-bold uppercase mb-4">ORDER SUMMARY</h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="flex gap-4 border-b border-foreground pb-4">
                      <img src={item.image} alt={item.name} className="w-20 h-20 object-cover bg-grey-bg" />
                      <div className="flex-1">
                        <h3 className="font-heading font-bold uppercase text-sm">{item.name}</h3>
                        <p className="text-xs text-grey-text">Size: {item.size}</p>
                        <p className="text-xs text-grey-text">Quantity: {item.quantity}</p>
                        <p className="font-heading font-bold mt-2">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Order Total */}
            <div className="md:col-span-1">
              <div className="sticky top-24 space-y-4 border border-foreground p-6">
                <h2 className="text-lg font-heading font-bold uppercase">ORDER TOTAL</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-grey-text">Subtotal</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-grey-text">Shipping</span>
                    <span>
                      {shippingCharge === 0 ? (
                        <span className="text-jager-red">FREE</span>
                      ) : (
                        `₹${shippingCharge}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-grey-text">Tax (GST)</span>
                    <span>₹{tax.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-foreground pt-2 mt-2">
                    <div className="flex justify-between font-heading font-bold text-lg">
                      <span>TOTAL</span>
                      <span>₹{finalTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handlePlaceOrder}
                  disabled={!selectedAddress || items.length === 0 || processingPayment}
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "PLACE ORDER"
                  )}
                </Button>
                {shippingCharge === 0 && totalPrice < 2499 && (
                  <p className="text-xs text-grey-text text-center">
                    Add ₹{(2499 - totalPrice).toLocaleString()} more for free shipping!
                  </p>
                )}
                {totalPrice >= 2499 && (
                  <p className="text-xs text-jager-red text-center font-bold">
                    ✓ Free shipping applied
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Checkout;

