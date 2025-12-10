import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Filter, FileText, Download } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { generatePackingSlip } from "@/lib/pdfGenerator";

interface Order {
  id: string;
  user_id: string;
  status: string;
  order_type: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  shipping_address: any;
  tracking_number: string | null;
  created_at: string;
  user?: {
    email: string;
  };
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  pending_print: "bg-yellow-500",
  printing: "bg-orange-500",
  quality_check: "bg-purple-500",
  ready_to_ship: "bg-indigo-500",
  shipped: "bg-green-500",
  delivered: "bg-green-700",
  cancelled: "bg-red-500",
  pending: "bg-gray-500",
  confirmed: "bg-green-600",
  processing: "bg-blue-600",
};

const Orders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin', 'orders', statusFilter, typeFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== "all") {
        if (statusFilter === 'printing') {
          // If filtering by "Processing" (printing), include all processing statuses
          query = query.in('status', ['pending_print', 'printing', 'quality_check', 'ready_to_ship']);
        } else if (statusFilter === 'new') {
          // If filtering by "Confirmed" (new), include new
          query = query.eq('status', 'new');
        } else {
          query = query.eq('status', statusFilter);
        }
      }

      if (typeFilter !== "all") {
        query = query.eq('order_type', typeFilter);
      }

      if (searchQuery) {
        query = query.or(`id.ilike.%${searchQuery}%,user.email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
  });

  // Update order status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      toast.success("Order status updated");
    },
    onError: (error) => {
      console.error("Status update failed:", error);
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Update tracking number mutation
  const updateTracking = useMutation({
    mutationFn: async ({ orderId, tracking }: { orderId: string; tracking: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({
          tracking_number: tracking,
          status: 'shipped'
        })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await updateStatus.mutateAsync({ orderId, newStatus });
  };

  const handleFilterChange = (filterType: 'status' | 'type', value: string) => {
    if (filterType === 'status') {
      setStatusFilter(value);
      searchParams.set('status', value === 'all' ? '' : value);
    } else {
      setTypeFilter(value);
      searchParams.set('type', value === 'all' ? '' : value);
    }
    setSearchParams(searchParams);
  };

  // Generate PDF function
  const generatePDF = async (order: Order) => {
    try {
      // Fetch order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (itemsError) throw itemsError;

      if (!orderItems || orderItems.length === 0) {
        toast.error("No items found for this order");
        return;
      }

      // Generate packing slip
      await generatePackingSlip({
        orderId: order.id,
        orderDate: format(new Date(order.created_at || new Date()), 'dd MMM yyyy'),
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
        subtotal: Number(order.subtotal || 0),
        shipping: Number(order.shipping || 0),
        tax: Number(order.tax || 0),
        total: Number(order.total || 0),
      });

      toast.success("Packing slip generated successfully!");
    } catch (error: any) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF: " + (error.message || "Unknown error"));
    }
  };

  // Helper to normalize status for UI
  const getDisplayStatus = (status: string) => {
    if (['pending_print', 'printing', 'quality_check', 'ready_to_ship'].includes(status)) return 'PROCESSING';
    if (status === 'new') return 'CONFIRMED';
    return status.replace('_', ' ').toUpperCase();
  };

  // Helper to normalize status for Select value
  const getSelectValue = (status: string) => {
    if (['pending_print', 'printing', 'quality_check', 'ready_to_ship'].includes(status)) return 'printing';
    return status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Orders</h1>
          <p className="text-grey-text mt-1">Manage all orders</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading font-bold uppercase text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-grey-text" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">Confirmed</SelectItem>
                <SelectItem value="printing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="collection">Collection</SelectItem>
                <SelectItem value="basic_custom">Basic Custom</SelectItem>
                <SelectItem value="pro_custom">Pro Custom</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-grey-text flex items-center">
              Showing {orders?.length || 0} orders
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="font-heading font-bold uppercase text-lg hover:text-jager-red transition-colors"
                      >
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                      <Badge className={`${statusColors[order.status] || 'bg-gray-500'} text-white uppercase text-xs`}>
                        {getDisplayStatus(order.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-grey-text">
                      {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                    <p className="text-sm text-grey-text">
                      Type: <span className="font-bold uppercase">{order.order_type?.replace('_', ' ') || 'collection'}</span>
                    </p>
                    {order.user_id && (
                      <p className="text-sm text-grey-text mt-1">
                        Customer ID: {order.user_id.slice(0, 8)}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-sm text-grey-text mb-1">Shipping Address</p>
                    <p className="text-sm font-body">
                      {order.shipping_address?.full_name || 'N/A'}
                    </p>
                    <p className="text-xs text-grey-text">
                      {order.shipping_address?.city}, {order.shipping_address?.state}
                    </p>
                    {order.tracking_number && (
                      <p className="text-xs text-grey-text mt-1">
                        Tracking: {order.tracking_number}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-grey-text mb-1">Total</p>
                    <p className="text-lg font-heading font-bold">₹{Number(order.total).toLocaleString()}</p>
                  </div>
                  <div className="md:col-span-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Select
                        value={getSelectValue(order.status)}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                        disabled={updateStatus.isPending && updateStatus.variables?.orderId === order.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Confirmed</SelectItem>
                          <SelectItem value="printing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      {updateStatus.isPending && updateStatus.variables?.orderId === order.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-jager-red" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generatePDF(order)}
                        className="flex-1 text-xs"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                      <Link to={`/admin/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="flex-1 text-xs">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-grey-text">No orders found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Orders;
