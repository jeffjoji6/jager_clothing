import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2, Package } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { generateInvoice } from "@/lib/pdfGenerator";
import { Download } from "lucide-react";

interface Order {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  created_at: string;
  shipping_address: any;
}

interface OrderItem {
  id: string;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

const Orders = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });

  // Fetch company settings for invoice
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') return null;

      // Map to CompanyInfo
      if (data) {
        return {
          name: data.company_name,
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          phone: data.phone || "",
          email: data.email || "",
          website: "www.jagerclothing.com",
          gstin: data.gstin,
          bank_name: data.bank_name,
          account_number: data.account_number,
          ifsc_code: data.ifsc_code,
          account_holder_name: data.account_holder_name,
          upi_id: data.upi_id
        };
      }
      return null;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const handleDownloadInvoice = async (order: Order) => {
    try {
      toast.info("Generating invoice...");

      // Fetch order items
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (error) throw error;
      if (!orderItems || orderItems.length === 0) {
        toast.error("No items found for this order");
        return;
      }

      const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}-${format(new Date(), 'yyyyMMdd')}`;

      await generateInvoice(
        {
          orderId: order.id,
          orderDate: format(new Date(order.created_at), 'dd MMM yyyy'),
          customerName: order.shipping_address?.full_name || "Customer",
          customerAddress: {
            street: order.shipping_address?.street || "",
            city: order.shipping_address?.city || "",
            state: order.shipping_address?.state || "",
            zip: order.shipping_address?.zip || "",
            phone: order.shipping_address?.phone || "",
          },
          items: orderItems.map((item: any) => ({
            name: item.product_name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: Number(item.price),
          })),
          subtotal: Number(order.subtotal),
          shipping: Number(order.shipping),
          tax: Number(order.tax),
          total: Number(order.total),
        },
        invoiceNumber,
        companySettings || undefined,
        18
      );

      toast.success("Invoice downloaded!");
    } catch (error: any) {
      console.error("Invoice generation error:", error);
      toast.error("Failed to generate invoice: " + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'processing':
        return 'text-blue-600';
      case 'shipped':
        return 'text-purple-600';
      case 'delivered':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-grey-text';
    }
  };

  if (isLoading) {
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

        <div className="container mx-auto px-4 py-8 md:py-12">
          <h1 className="text-3xl md:text-5xl font-heading font-bold uppercase tracking-tight mb-8">
            MY ORDERS
          </h1>

          {!orders || orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-16 w-16 text-grey-text mb-4" />
              <p className="text-grey-text mb-4">You haven't placed any orders yet.</p>
              <Button asChild variant="hero">
                <Link to="/collection">START SHOPPING</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="border border-foreground p-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <h2 className="font-heading font-bold uppercase text-lg">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </h2>
                        <span className={`font-body uppercase text-sm font-bold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-grey-text font-body">
                        Placed on {format(new Date(order.created_at), 'MMMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-heading font-bold text-xl">₹{order.total.toLocaleString()}</p>
                      <Link to={`/order-confirmation/${order.id}`}>
                        <Button variant="outline" size="sm" className="mt-2">
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 ml-2 text-xs"
                        onClick={() => handleDownloadInvoice(order)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Invoice
                      </Button>
                    </div>
                  </div>
                  {order.shipping_address && (
                    <div className="pt-4 border-t border-foreground">
                      <p className="text-sm text-grey-text font-body">
                        Shipping to: {order.shipping_address.city}, {order.shipping_address.state}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Orders;

