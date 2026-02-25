import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
import { openRazorpayCheckout, createRazorpayOrder } from "@/lib/razorpay";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);

  // Fetch shipping and tax settings
  const { data: companySettings } = useQuery({
    queryKey: ['checkout-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('shipping_rate, free_shipping_threshold, default_tax_rate')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') return null;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });


  const standardShippingRate = companySettings?.shipping_rate ?? 100;
  const freeShippingThreshold = companySettings?.free_shipping_threshold ?? 499;
  const taxRate = companySettings?.default_tax_rate ?? 18;

  // Calculate discounted subtotal
  const discountedSubtotal = Math.max(0, totalPrice - discountAmount);

  const shippingCharge = discountedSubtotal > freeShippingThreshold ? 0 : standardShippingRate;

  // Tax is inclusive of the product price
  // We extract the tax amount from the discounted subtotal
  const tax = Math.round(discountedSubtotal - (discountedSubtotal / (1 + (taxRate / 100))));

  const finalTotal = Math.round(discountedSubtotal + shippingCharge);

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        code_input: couponCode,
        cart_total: totalPrice
      });

      if (error) throw error;

      if (data.valid) {
        setDiscountAmount(data.discount);
        setAppliedCoupon({
          code: data.code,
          type: data.type,
          value: data.discount
        });
        toast.success(data.message);
      } else {
        setDiscountAmount(0);
        setAppliedCoupon(null);
        toast.error(data.message);
      }
    } catch (err: any) {
      toast.error('Failed to validate coupon');
      console.error(err);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setDiscountAmount(0);
    setAppliedCoupon(null);
    toast.info("Coupon removed");
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
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
          discount_amount: discountAmount,
          shipping_address: {
            full_name: address.full_name,
            street: address.street,
            city: address.city,
            state: address.state,
            zip: address.zip,
            phone: address.phone,
            email: user?.email, // Save email for notifications
          },
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // If coupon used, increment usage
      if (appliedCoupon) {
        await supabase.rpc('increment_coupon_usage', { code_input: appliedCoupon.code });
      }

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

      // Try to create Razorpay order via backend (optional)
      // If backend is not set up, checkout will work without order_id
      let razorpayOrderId: string | null = null;

      try {
        const razorpayOrder = await createRazorpayOrder(
          finalTotal,
          `order_${order.id}`
        );
        razorpayOrderId = razorpayOrder?.id || null;
      } catch (error) {
        console.warn('Could not create Razorpay order via backend, using checkout without order:', error);
        // Continue without order_id - Razorpay will create order automatically
      }

      // Check if test mode is enabled (for development/testing)
      const testModeEnabled = import.meta.env.VITE_ENABLE_TEST_PAYMENT_BYPASS === 'true';

      // Open Razorpay checkout (works with or without order_id)
      await openRazorpayCheckout(
        razorpayOrderId,
        finalTotal,
        async (paymentResponse) => {
          try {
            console.log('Payment successful! Verifying...', paymentResponse);
            console.log('Payment response keys:', Object.keys(paymentResponse));
            console.log('Payment response values:', {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            // Check if we have signature (pre-created order) or not (auto-created order)
            const hasSignature = !!paymentResponse.razorpay_signature;

            if (hasSignature) {
              // Full verification flow for pre-created orders
              const { verifyRazorpayPayment } = await import('@/lib/razorpay');
              const verification = await verifyRazorpayPayment(
                paymentResponse.razorpay_order_id,
                paymentResponse.razorpay_payment_id,
                paymentResponse.razorpay_signature,
                order.id
              );

              if (!verification.success) {
                throw new Error(verification.error || 'Payment verification failed');
              }
            } else {
              // Automatic order creation - just update with payment ID
              console.log('Payment made without pre-created order, updating status directly');

              const { error: updateError } = await supabase
                .from('orders')
                .update({
                  status: 'new',
                  payment_status: 'paid',
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                })
                .eq('id', order.id);

              if (updateError) {
                throw new Error(`Failed to update order: ${updateError.message}`);
              }
            }

            // Deduct stock after successful payment
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-stock`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    action: 'deduct',
                    order_id: order.id,
                    items: items.map(item => ({
                      product_variant_id: item.variant_id,
                      quantity: item.quantity,
                    })),
                  }),
                });

                if (!response.ok) {
                  const error = await response.json();
                  console.error('Stock deduction failed:', error);
                  // Don't fail the order, but log the error
                  toast.warning('Order placed but stock update failed. Admin will be notified.');
                }
              }
            } catch (stockError) {
              console.error('Error deducting stock:', stockError);
              // Don't fail the order, just log
            }

            // Send order notification email to admin
            try {
              const { sendOrderNotificationEmail } = await import('@/lib/emailService');
              await sendOrderNotificationEmail({
                orderId: order.id,
                customerEmail: user?.email || '',
                customerName: address.full_name,
                items: items.map(item => ({
                  name: item.name,
                  size: item.size,
                  color: item.name.split(' - ')[2] || '',
                  quantity: item.quantity,
                  price: item.price,
                })),
                shippingAddress: {
                  full_name: address.full_name,
                  street: address.street,
                  city: address.city,
                  state: address.state,
                  zip: address.zip,
                  phone: address.phone,
                },
                subtotal: totalPrice,
                shipping: shippingCharge,
                tax: tax,
                total: finalTotal,
                paymentId: paymentResponse.razorpay_payment_id,
              });
            } catch (emailError) {
              console.error('Error sending order notification email:', emailError);
              // Don't fail the order, just log
            }

            // Clear cart
            await clearCart();

            // Show success message
            toast.success("Payment successful!", {
              description: "Your order has been confirmed."
            });

            // Redirect to order confirmation
            navigate(`/order-confirmation/${order.id}`);
          } catch (error: any) {
            console.error('Error processing payment success:', error);
            setProcessingPayment(false);
            toast.error("Payment verification failed", {
              description: error.message || "Please contact support if payment was deducted."
            });
          }
        },
        (error) => {
          // Payment failed or cancelled
          console.error('Payment error:', error);
          setProcessingPayment(false);

          // Extract error message
          const errorMessage = error?.message || error?.toString() || "Payment could not be processed.";

          // Show appropriate error message
          if (errorMessage.includes('cancelled')) {
            toast.error("Payment cancelled", { description: "You cancelled the payment. Your order has been saved." });
          } else if (errorMessage.includes('International') || errorMessage.includes('international')) {
            // For international card errors, show longer message with test card info in dev
            const isDev = import.meta.env.DEV;
            toast.error("Payment method not supported", {
              description: errorMessage,
              duration: isDev ? 10000 : 6000 // Longer duration in dev to read test card info
            });
          } else {
            toast.error("Payment failed", {
              description: errorMessage,
              duration: 5000
            });
          }

          // Update order status to cancelled
          supabase
            .from('orders')
            .update({ status: 'cancelled', payment_status: 'failed' })
            .eq('id', order.id)
            .then(({ error: updateError }) => {
              if (updateError) {
                console.error('Failed to update order status:', updateError);
              }
            });
        },
        {
          name: address.full_name,
          email: user?.email || '',
          contact: address.phone,
        },
        testModeEnabled // Pass test mode flag
      );
    } catch (error: any) {
      setProcessingPayment(false);
      console.error("Order placement error:", error);

      let message = error.message || "Failed to place order";
      if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
        message = "Network error. Please check your internet connection and try again.";
      }

      toast.error("Failed to place order", { description: message });
    }
  };

  if (cartLoading || addressesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Checkout | Jager Clothing</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>

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
                        <DialogDescription>
                          {editingAddress ? "Update your shipping address details." : "Add a new shipping address for your orders."}
                        </DialogDescription>
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
                      <img src={item.image} alt={item.name} className="w-20 h-20 object-contain bg-white" />
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

                {/* Promo Code Input */}
                <div className="space-y-2 pt-2">
                  {!appliedCoupon && !showPromoInput ? (
                    <button
                      onClick={() => setShowPromoInput(true)}
                      className="text-xs text-muted-foreground hover:text-foreground underline decoration-dashed underline-offset-4 transition-colors"
                    >
                      Have a promo code?
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="PROMO CODE"
                          value={couponCode}
                          onChange={e => setCouponCode(e.target.value)}
                          disabled={!!appliedCoupon || couponLoading}
                          className="uppercase h-8 text-xs bg-background"
                        />
                        {appliedCoupon ? (
                          <Button variant="outline" size="icon" onClick={() => { handleRemoveCoupon(); setShowPromoInput(false); }} className="h-8 w-8">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode} className="h-8 px-3 text-xs">
                            {couponLoading ? <Loader2 className="animate-spin h-3 w-3" /> : "APPLY"}
                          </Button>
                        )}
                      </div>
                      {/* Cancel button if open but no coupon */}
                      {!appliedCoupon && (
                        <button
                          onClick={() => setShowPromoInput(false)}
                          className="text-[10px] text-muted-foreground hover:text-red-500"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="text-green-600 text-xs font-bold flex items-center gap-1 bg-green-50 p-2 rounded border border-green-100">
                      <Tag className="h-3 w-3" /> Coupon {appliedCoupon.code} applied!
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-grey-text">Subtotal</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600 font-bold">
                      <span>Discount</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
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
                    <span className="text-grey-text">Tax (Included)</span>
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
                <p className="text-xs text-jager-red text-center font-bold">
                  {shippingCharge === 0 ? "✓ Free shipping applied" : `Add items worth ₹${(freeShippingThreshold - totalPrice).toLocaleString()} more for free shipping`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Checkout;

