import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Download, Plus, Search, DollarSign, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { generateInvoice } from "@/lib/pdfGenerator";

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string | null;
  user_id: string;
  subtotal: number;
  shipping: number;
  tax_rate: number;
  cgst: number;
  sgst: number;
  total_tax: number;
  total_amount: number;
  invoice_date: string;
  due_date: string | null;
  payment_status: string;
  payment_date: string | null;
  company_gstin: string | null;
  billing_address: any;
  created_at: string;
}

interface CompanySettings {
  id: string;
  company_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  gstin: string;
  default_tax_rate: number;
  invoice_prefix: string;
}

const Billing = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['admin', 'invoices', statusFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq('payment_status', statusFilter);
      }

      if (searchQuery) {
        query = query.or(`invoice_number.ilike.%${searchQuery}%,order_id.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Invoice[];
    },
  });

  // Fetch company settings
  const { data: companySettings } = useQuery({
    queryKey: ['admin', 'company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        // Return default if not found
        return {
          company_name: "Jager Clothing",
          address: "Your Address",
          city: "City",
          state: "State",
          zip: "ZIP",
          phone: "+91 XXXXX XXXXX",
          email: "info@jagerclothing.com",
          gstin: "",
          default_tax_rate: 18,
          invoice_prefix: "INV",
        } as CompanySettings;
      }

      return data as CompanySettings;
    },
  });

  // Fetch orders without invoices
  const { data: ordersWithoutInvoices } = useQuery({
    queryKey: ['admin', 'orders-without-invoices'],
    queryFn: async () => {
      const { data: allOrders } = await supabase
        .from('orders')
        .select('id, total, created_at, shipping_address, subtotal, shipping, tax')
        .in('status', ['confirmed', 'processing', 'shipped', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: invoices } = await supabase
        .from('invoices')
        .select('order_id');

      const invoicedOrderIds = new Set(invoices?.map(i => i.order_id) || []);

      return allOrders?.filter(order => !invoicedOrderIds.has(order.id)) || [];
    },
  });

  // Create invoice from order
  const createInvoice = useMutation({
    mutationFn: async (orderId: string) => {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Generate invoice number
      const { data: invoiceNum, error: numError } = await supabase
        .rpc('generate_invoice_number');

      if (numError) throw numError;

      // Calculate GST
      const subtotal = Number(order.subtotal) + Number(order.shipping || 0);
      const taxRate = companySettings?.default_tax_rate || 18;
      
      // Calculate GST breakdown
      const { data: gstCalc, error: gstError } = await supabase
        .rpc('calculate_gst', {
          subtotal_amount: subtotal,
          tax_rate: taxRate,
        });

      if (gstError) throw gstError;

      const gstResult = Array.isArray(gstCalc) ? gstCalc[0] : gstCalc;
      const totalAmount = Number(order.total);

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNum,
          order_id: orderId,
          user_id: order.user_id,
          subtotal: order.subtotal,
          shipping: order.shipping || 0,
          tax_rate: taxRate,
          cgst: gstResult?.cgst || 0,
          sgst: gstResult?.sgst || 0,
          total_tax: gstResult?.total_gst || Number(order.tax || 0),
          total_amount: totalAmount,
          invoice_date: new Date().toISOString(),
          payment_status: order.payment_status === 'paid' ? 'paid' : 'pending',
          company_gstin: companySettings?.gstin || null,
          billing_address: order.shipping_address,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      if (order.order_items && Array.isArray(order.order_items)) {
        const items = order.order_items.map((item: any) => ({
          invoice_id: invoice.id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.price,
          tax_rate: taxRate,
          tax_amount: (item.price * item.quantity * taxRate) / (100 + taxRate),
          total_amount: item.price * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders-without-invoices'] });
      toast.success("Invoice created successfully!");
      setSelectedOrderId(null);
    },
  });

  // Update payment status
  const updatePaymentStatus = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string; status: string }) => {
      const updateData: any = { payment_status: status };
      if (status === 'paid') {
        updateData.payment_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invoices'] });
      toast.success("Payment status updated");
    },
  });

  // Download invoice PDF
  const downloadInvoicePDF = async (invoice: Invoice) => {
    try {
      // Fetch order and items
      const { data: order } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', invoice.order_id || '')
        .single();

      if (!order) {
        toast.error("Order not found");
        return;
      }

      generateInvoice(
        {
          orderId: invoice.order_id || invoice.id,
          orderDate: format(new Date(invoice.invoice_date), 'dd MMM yyyy'),
          customerName: invoice.billing_address?.full_name || "Customer",
          customerAddress: {
            street: invoice.billing_address?.street || "",
            city: invoice.billing_address?.city || "",
            state: invoice.billing_address?.state || "",
            zip: invoice.billing_address?.zip || "",
            phone: invoice.billing_address?.phone || "",
          },
          items: (order.order_items || []).map((item: any) => ({
            name: item.product_name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: Number(item.price),
          })),
          subtotal: Number(invoice.subtotal),
          shipping: Number(invoice.shipping),
          tax: Number(invoice.total_tax),
          total: Number(invoice.total_amount),
        },
        invoice.invoice_number,
        companySettings ? {
          name: companySettings.company_name,
          address: companySettings.address,
          city: companySettings.city,
          state: companySettings.state,
          zip: companySettings.zip,
          phone: companySettings.phone,
          email: companySettings.email,
          gstin: companySettings.gstin,
        } : undefined,
        invoice.tax_rate
      );
    } catch (error: any) {
      toast.error("Failed to generate invoice: " + error.message);
    }
  };

  const paymentStatusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    paid: "bg-green-500",
    partial: "bg-blue-500",
    cancelled: "bg-red-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Billing & Invoices</h1>
          <p className="text-grey-text mt-1">Manage invoices and GST billing</p>
        </div>
        <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedOrderId(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold uppercase">Create Invoice from Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-heading font-bold uppercase mb-2 block">Select Order</Label>
                <Select
                  value={selectedOrderId || ""}
                  onValueChange={setSelectedOrderId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {ordersWithoutInvoices?.map((order: any) => (
                      <SelectItem key={order.id} value={order.id}>
                        Order #{order.id.slice(0, 8)} - ₹{Number(order.total).toLocaleString()} - {format(new Date(order.created_at), 'MMM dd, yyyy')}
                      </SelectItem>
                    ))}
                    {(!ordersWithoutInvoices || ordersWithoutInvoices.length === 0) && (
                      <div className="p-4 text-sm text-grey-text">No orders available for invoicing</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {selectedOrderId && (
                <Button
                  onClick={() => createInvoice.mutate(selectedOrderId)}
                  disabled={createInvoice.isPending}
                  className="w-full"
                >
                  {createInvoice.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Invoice...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Invoice with GST
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-grey-text" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : invoices && invoices.length > 0 ? (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Receipt className="h-5 w-5 text-jager-red" />
                      <div>
                        <p className="font-heading font-bold uppercase">{invoice.invoice_number}</p>
                        <p className="text-sm text-grey-text">
                          {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    {invoice.order_id && (
                      <Link
                        to={`/admin/orders/${invoice.order_id}`}
                        className="text-sm text-jager-red underline"
                      >
                        View Order
                      </Link>
                    )}
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-sm text-grey-text mb-1">Payment Status</p>
                    <Badge className={`${paymentStatusColors[invoice.payment_status] || 'bg-gray-500'} text-white uppercase text-xs`}>
                      {invoice.payment_status}
                    </Badge>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-sm text-grey-text mb-1">Amount</p>
                    <p className="font-heading font-bold text-lg">₹{invoice.total_amount.toLocaleString()}</p>
                    <p className="text-xs text-grey-text">
                      GST ({invoice.tax_rate}%): ₹{invoice.total_tax.toLocaleString()}
                    </p>
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <Select
                      value={invoice.payment_status}
                      onValueChange={(value) => updatePaymentStatus.mutate({ invoiceId: invoice.id, status: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadInvoicePDF(invoice)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Receipt className="h-16 w-16 text-grey-text mx-auto mb-4" />
            <p className="text-grey-text">No invoices found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Billing;

