import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, FileText, Download, Package } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { generatePackingSlip, generateInvoice } from "@/lib/pdfGenerator";

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
  notes: string | null;
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

interface OrderHistory {
  id: string;
  action: string;
  description: string;
  created_at: string;
}

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);

  // Fetch order
  const { data: order, isLoading } = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setTrackingNumber(data.tracking_number || "");
        setNotes(data.notes || "");
      }
      return data as Order;
    },
    enabled: !!id,
  });

  // Fetch order items
  const { data: orderItems } = useQuery({
    queryKey: ['admin', 'order', id, 'items'],
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

  // Fetch order history
  const { data: orderHistory } = useQuery({
    queryKey: ['admin', 'order', id, 'history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_history')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrderHistory[];
    },
    enabled: !!id && !!order,
  });

  // Fetch customer email
  const { data: customerEmail } = useQuery({
    queryKey: ['admin', 'user_email', order?.user_id],
    queryFn: async () => {
      if (!order?.user_id) return null;
      const { data, error } = await supabase.rpc('get_user_emails', {
        user_ids: [order.user_id]
      });

      if (error) {
        console.error("Failed to fetch customer email:", error);
        return null;
      }

      return data && data[0] ? data[0].email : null;
    },
    enabled: !!order?.user_id,
  });

  const customer = order?.user_id ? {
    email: customerEmail || "Email not available",
    id: order.user_id,
  } : null;

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      toast.success("Order status updated");
    },
  });

  // Update tracking mutation
  const updateTracking = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('orders')
        .update({
          tracking_number: trackingNumber,
          status: 'shipped'
        })
        .eq('id', id!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] });
      toast.success("Tracking number added");
      setShowTrackingDialog(false);
    },
  });

  // Update notes mutation
  const updateNotes = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('orders')
        .update({ notes })
        .eq('id', id!);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notes updated");
    },
  });

  // Fetch company settings
  const { data: companySettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') return null;

      // Map to CompanyInfo interface
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
    staleTime: 1000 * 60 * 5,
  });

  // Generate PDF Packing Slip
  const generatePDF = async () => {
    if (!order || !orderItems) {
      toast.error("Order data not available");
      return;
    }

    try {
      await generatePackingSlip({
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
        items: orderItems.map((item) => ({
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
      }, companySettings || undefined);
      toast.success("Packing slip generated successfully!");
    } catch (error: any) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF: " + error.message);
    }
  };

  // Generate Invoice with GST
  const generateInvoicePDF = async () => {
    if (!order || !orderItems) {
      toast.error("Order data not available");
      return;
    }

    try {
      // Generate invoice number (can be stored in database)
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
          items: orderItems.map((item) => ({
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
        companySettings || undefined, // Pass company settings
        18
      );
      toast.success("Invoice generated successfully!");
    } catch (error: any) {
      console.error("Invoice generation error:", error);
      toast.error("Failed to generate invoice: " + error.message);
    }
  };

  if (isLoading || !order) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/orders")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-grey-text mt-1">
            {format(new Date(order.created_at), 'MMMM dd, yyyy HH:mm')}
          </p>
        </div>
        <Badge className={`${statusColors[order.status] || 'bg-gray-500'} text-white uppercase ml-auto`}>
          {getDisplayStatus(order.status)}
        </Badge>
      </div>

      {/* Visual Order Stepper */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            {/* Progress Bar Background */}
            <div className="absolute top-[15px] left-0 w-full h-[2px] bg-grey-bg/20 -z-10" />

            <div className="flex justify-between w-full">
              {[
                { id: 'new', label: 'Confirmed', icon: "✓" },
                { id: 'processing', label: 'Processing', icon: "⚙️" },
                { id: 'shipped', label: 'Shipped', icon: "🚚" },
                { id: 'delivered', label: 'Delivered', icon: "🏠" }
              ].map((step, index) => {
                // Determine status matches
                const isConfirmed = order.status === 'new' || ['pending_print', 'printing', 'quality_check', 'ready_to_ship', 'shipped', 'delivered'].includes(order.status);
                const isProcessing = ['pending_print', 'printing', 'quality_check', 'ready_to_ship'].includes(order.status) || ['shipped', 'delivered'].includes(order.status);
                const isShipped = order.status === 'shipped' || order.status === 'delivered';
                const isDelivered = order.status === 'delivered';

                let isActive = false;
                let isCompleted = false;

                if (step.id === 'new') {
                  isActive = order.status === 'new';
                  isCompleted = isConfirmed;
                } else if (step.id === 'processing') {
                  isActive = ['pending_print', 'printing', 'quality_check', 'ready_to_ship'].includes(order.status);
                  isCompleted = isShipped || isDelivered;
                } else if (step.id === 'shipped') {
                  isActive = order.status === 'shipped';
                  isCompleted = isDelivered;
                } else if (step.id === 'delivered') {
                  isActive = order.status === 'delivered';
                  isCompleted = false; // Last step stays active
                }

                const handleStepClick = () => {
                  if (step.id === 'new') updateStatus.mutate('new');
                  else if (step.id === 'processing') {
                    // Default to pending_print if moving into processing, or keep current if already there
                    if (!['pending_print', 'printing', 'quality_check', 'ready_to_ship'].includes(order.status)) {
                      updateStatus.mutate('pending_print');
                    }
                  }
                  else if (step.id === 'shipped') updateStatus.mutate('shipped');
                  else if (step.id === 'delivered') updateStatus.mutate('delivered');
                };

                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center cursor-pointer group"
                    onClick={handleStepClick}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 z-10 
                              ${isActive
                        ? 'bg-jager-red border-jager-red text-white scale-110 shadow-lg'
                        : isCompleted
                          ? 'bg-foreground border-foreground text-background'
                          : 'bg-background border-border text-muted-foreground'
                      } group-hover:border-jager-red`}
                    >
                      {isCompleted ? "✓" : (index + 1)}
                    </div>
                    <span className={`text-xs md:text-sm font-heading font-black uppercase mt-3 transition-colors tracking-wide ${isActive ? 'text-jager-red' : isCompleted ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Progress Bar Fill - Simplified for 4 steps */}
            <div className="absolute top-[15px] left-0 h-[2px] bg-foreground -z-10 transition-all duration-500"
              style={{
                width: order.status === 'delivered' ? '100%'
                  : order.status === 'shipped' ? '66%'
                    : ['pending_print', 'printing', 'quality_check', 'ready_to_ship'].includes(order.status) ? '33%'
                      : '0%'
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading font-bold uppercase">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-heading font-bold uppercase">Email</Label>
                <p className="text-sm mt-1">{customer?.email || order.user_id || "Guest Order"}</p>
              </div>
              <div>
                <Label className="text-sm font-heading font-bold uppercase">Shipping Address</Label>
                <div className="text-sm mt-1 space-y-1">
                  <p>{order.shipping_address?.full_name}</p>
                  <p>{order.shipping_address?.street}</p>
                  <p>
                    {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zip}
                  </p>
                  <p>Phone: {order.shipping_address?.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading font-bold uppercase">Products Ordered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-foreground pb-4">
                    <div>
                      <p className="font-heading font-bold uppercase">{item.product_name}</p>
                      <p className="text-sm text-grey-text">
                        Size: {item.size} | Color: {item.color} | Quantity: {item.quantity}
                      </p>
                    </div>
                    <p className="font-heading font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-foreground space-y-2">
                <div className="flex justify-between">
                  <span className="text-grey-text">Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-text">Shipping</span>
                  <span>₹{order.shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-text">Tax</span>
                  <span>₹{order.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-heading font-bold text-lg pt-2 border-t border-foreground">
                  <span>TOTAL</span>
                  <span>₹{order.total.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order History */}
          {orderHistory && orderHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading font-bold uppercase">Order History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orderHistory.map((history) => (
                    <div key={history.id} className="border-l-2 border-foreground pl-4 pb-3">
                      <p className="text-sm font-heading font-bold uppercase">{history.action.replace('_', ' ')}</p>
                      <p className="text-sm text-grey-text">{history.description}</p>
                      <p className="text-xs text-grey-text mt-1">
                        {format(new Date(history.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading font-bold uppercase">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Change Status */}
              <div>
                <Label className="text-sm font-heading font-bold uppercase mb-2 block">Change Status</Label>
                <Select
                  value={getSelectValue(order.status)}
                  onValueChange={(value) => updateStatus.mutate(value)}
                  disabled={updateStatus.isPending}
                >
                  <SelectTrigger>
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
              </div>

              {/* Tracking Number */}
              <div>
                <Label className="text-sm font-heading font-bold uppercase mb-2 block">Tracking Number</Label>
                <div className="flex gap-2">
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                  <Button
                    onClick={() => updateTracking.mutate()}
                    disabled={updateTracking.isPending || !trackingNumber}
                    size="sm"
                  >
                    {updateTracking.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
              </div>

              {/* Generate PDFs */}
              <Button
                variant="outline"
                className="w-full"
                onClick={generatePDF}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Packing Slip
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={generateInvoicePDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Invoice (GST)
              </Button>

              {/* Notes */}
              <div>
                <Label className="text-sm font-heading font-bold uppercase mb-2 block">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={4}
                />
                <Button
                  onClick={() => updateNotes.mutate()}
                  disabled={updateNotes.isPending}
                  size="sm"
                  className="mt-2"
                  variant="outline"
                >
                  {updateNotes.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Notes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

