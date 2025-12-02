import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2, CheckCircle2, Package, Truck, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  shipping_address: any;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

const OrderTracker = ({ status }: { status: string }) => {
  const steps = [
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { id: 'processing', label: 'Processing', icon: Package },
    { id: 'shipped', label: 'Shipped', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: Home },
  ];

  // Map status to step index
  const getStatusIndex = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'pending') return 0; // Treat pending as confirmed for now
    return steps.findIndex(s => s.id === normalizedStatus);
  };

  const currentStepIndex = getStatusIndex(status);

  return (
    <div className="w-full py-8">
      <div className="relative flex justify-between">
        {/* Progress Bar Background */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0" />

        {/* Active Progress Bar */}
        <div
          className="absolute top-1/2 left-0 h-1 bg-jager-red -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center bg-background px-1 md:px-2">
              <div
                className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isActive
                    ? "bg-jager-red border-jager-red text-white shadow-lg scale-110"
                    : "bg-background border-gray-300 text-gray-300"
                )}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span
                className={cn(
                  "mt-1 md:mt-2 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-center",
                  isActive ? "text-foreground" : "text-muted-foreground",
                  isCurrent && "text-jager-red"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OrderConfirmation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Order;
    },
    enabled: !!id,
  });

  const { data: orderItems } = useQuery({
    queryKey: ['order-items', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!id && !!order,
  });

  useEffect(() => {
    if (order && order.status === 'cancelled') {
      navigate('/orders');
    }
  }, [order, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <p className="text-center">Order not found</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <CheckCircle2 className="h-20 w-20 text-jager-red mx-auto animate-bounce" />
              <h1 className="text-3xl md:text-5xl font-heading font-bold uppercase tracking-tight">
                ORDER CONFIRMED!
              </h1>
              <p className="text-grey-text text-lg max-w-md mx-auto">
                Thank you for your purchase. Your order has been received and is being processed.
              </p>
            </div>

            {/* Order Tracker */}
            <div className="bg-grey-bg/50 p-4 md:p-8 border border-foreground/10 rounded-lg">
              <OrderTracker status={order.status} />
            </div>

            <div className="bg-grey-bg p-6 md:p-8 space-y-6 text-left border border-foreground/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-foreground/10 pb-6">
                <div>
                  <p className="text-sm text-grey-text uppercase tracking-wider">Order Number</p>
                  <p className="font-heading font-bold text-xl">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm text-grey-text uppercase tracking-wider">Order Date</p>
                  <p className="font-heading font-bold text-xl">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              {orderItems && orderItems.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Items Ordered</h2>
                  <div className="space-y-4">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center border-b border-foreground/10 pb-4 last:border-0 last:pb-0">
                        <div className="flex-1">
                          <p className="font-heading font-bold uppercase text-lg">{item.product_name}</p>
                          <p className="text-sm text-grey-text mt-1">
                            Size: <span className="text-foreground font-medium">{item.size}</span> •
                            Color: <span className="text-foreground font-medium">{item.color}</span> •
                            Qty: <span className="text-foreground font-medium">{item.quantity}</span>
                          </p>
                        </div>
                        <p className="font-heading font-bold text-lg">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t-2 border-foreground pt-6 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-grey-text">Subtotal</span>
                  <span className="font-medium">₹{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-grey-text">Shipping</span>
                  <span className="font-medium text-jager-red">
                    {order.shipping === 0 ? "FREE" : `₹${order.shipping}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-grey-text">Tax</span>
                  <span className="font-medium">₹{order.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-foreground/10 mt-4">
                  <span className="font-heading font-bold uppercase text-xl">Total</span>
                  <span className="font-heading font-bold text-2xl text-jager-red">₹{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {order.shipping_address && (
              <div className="bg-grey-bg p-6 md:p-8 text-left border border-foreground/10">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Shipping To</h2>
                <div className="font-body text-lg leading-relaxed">
                  <p className="font-bold">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.street}</p>
                  <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                  <p className="mt-2 text-grey-text text-sm">Phone: {order.shipping_address.phone}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base tracking-widest">
                <Link to="/orders">VIEW ALL ORDERS</Link>
              </Button>
              <Button asChild variant="hero" size="lg" className="h-14 px-8 text-base tracking-widest">
                <Link to="/collection">CONTINUE SHOPPING</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default OrderConfirmation;

