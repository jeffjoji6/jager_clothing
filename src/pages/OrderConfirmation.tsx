import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2, CheckCircle2 } from "lucide-react";

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
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <CheckCircle2 className="h-16 w-16 text-jager-red mx-auto" />
            <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tight">
              ORDER CONFIRMED!
            </h1>
            <p className="text-grey-text">
              Thank you for your order. We've received your order and will begin processing it right away.
            </p>
            <div className="bg-grey-bg p-6 space-y-4 text-left">
              <div className="flex justify-between items-center border-b border-foreground pb-4">
                <span className="font-heading font-bold uppercase">Order Number</span>
                <span className="font-body">{order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-foreground pb-4">
                <span className="font-heading font-bold uppercase">Status</span>
                <span className="font-body uppercase">{order.status}</span>
              </div>
              <div className="flex justify-between items-center border-b border-foreground pb-4">
                <span className="font-heading font-bold uppercase">Order Date</span>
                <span className="font-body">
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-heading font-bold uppercase">Total</span>
                <span className="font-heading font-bold text-xl">₹{order.total.toLocaleString()}</span>
              </div>
            </div>

            {orderItems && orderItems.length > 0 && (
              <div className="bg-grey-bg p-6 space-y-4">
                <h2 className="text-xl font-heading font-bold uppercase text-left">Order Items</h2>
                <div className="space-y-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-start border-b border-foreground pb-4">
                      <div>
                        <p className="font-heading font-bold uppercase">{item.product_name}</p>
                        <p className="text-sm text-grey-text">
                          Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-heading font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.shipping_address && (
              <div className="bg-grey-bg p-6 text-left">
                <h2 className="text-xl font-heading font-bold uppercase mb-4">Shipping Address</h2>
                <p className="font-body">
                  {order.shipping_address.full_name}<br />
                  {order.shipping_address.street}<br />
                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}<br />
                  Phone: {order.shipping_address.phone}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" size="lg">
                <Link to="/orders">VIEW ALL ORDERS</Link>
              </Button>
              <Button asChild variant="hero" size="lg">
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

