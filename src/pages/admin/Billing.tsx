import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Download, Plus, Search, Receipt, Trash2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
}

const Billing = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("order");
  const [customInvoice, setCustomInvoice] = useState({
    customerName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    items: [{ name: "", size: "", quantity: 1, price: 0 }]
  });

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
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { data: invoiceNum, error: numError } = await supabase
        .rpc('generate_invoice_number');

      if (numError) throw numError;

      const subtotal = Number(order.subtotal) + Number(order.shipping || 0);
      const taxRate = companySettings?.default_tax_rate || 18;

      const { data: gstCalc, error: gstError } = await supabase
        .rpc('calculate_gst', {
          subtotal_amount: subtotal,
          tax_rate: taxRate,
        });

      if (gstError) throw gstError;

      const gstResult = Array.isArray(gstCalc) ? gstCalc[0] : gstCalc;
      const totalAmount = Number(order.total);

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

  const paymentStatusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    paid: "bg-green-500",
    partial: "bg-blue-500",
    cancelled: "bg-red-500",
  };


  // Create Custom Invoice Mutation
  const createCustomInvoice = useMutation({
    mutationFn: async (data: typeof customInvoice) => {
      // Generate invoice number
      const { data: invoiceNum, error: numError } = await supabase.rpc('generate_invoice_number');
      if (numError) throw numError;

      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxRate = companySettings?.default_tax_rate || 18; // Default to 0? User asked to "avoid tax" but we might need structure. 
      // Actually user said "remove tax" display. But backend might expect it. 
      // Let's set rate to 0 effectively if we want "No Tax", or just calculate it but hide it in PDF? 
      // User said "we dont have tax at this point so avoid it". So tax_rate = 0.
      const effectiveTaxRate = 0;

      const totalAmount = subtotal; // No tax added

      // Create invoice record
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNum,
          order_id: null,
          user_id: (await supabase.auth.getUser()).data.user?.id, // Admin ID as placeholder
          subtotal: subtotal,
          shipping: 0,
          tax_rate: effectiveTaxRate,
          cgst: 0,
          sgst: 0,
          total_tax: 0,
          total_amount: totalAmount,
          invoice_date: new Date().toISOString(),
          payment_status: 'paid', // Custom bills usually created when paid? Default to pending maybe? Let's say Pending.
          company_gstin: companySettings?.gstin || null,
          billing_address: {
            full_name: data.customerName,
            phone: data.phone,
            street: data.street,
            city: data.city,
            state: data.state,
            zip: data.zip,
          },
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const items = data.items.map(item => ({
        invoice_id: invoice.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        size: item.size, // Assuming invoice_items has this or we store it in product_name? 
        // Standard invoice_items might not have 'size' column yet? 
        // Let's append size to name if no column. 
        // Actually, let's verify if we can add 'size' metadata or just put in name for now to be safe.
        // Wait, the PDF needs size. 
        // I will assume invoice_items schema (Lines 198) doesn't explicitly show 'size' in the SELECT on line 123 of order items, but it copies it?
        // Line 275 of existing code: `size: item.size` in downloadInvoicePDF exists for Orders. 
        // But for `invoice_items` table? 
        // I'll format name as `Name (Size)` to be safe for DB, but pass properly to PDF generator.
        tax_rate: 0,
        tax_amount: 0,
        total_amount: item.price * item.quantity,
      }));

      // We might need to handle 'size' storage. If 'invoice_items' table doesn't have it, we lose it for re-generation.
      // For now, let's just insert standard standard fields. 
      // Note: The PDF generator uses `order_items` from the ORDER table usually. 
      // For custom invoice without order, `downloadInvoicePDF` will fail if it looks for `orders`.
      // I need to update `downloadInvoicePDF` to handle null order_id!

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(items.map(i => ({
          invoice_id: i.invoice_id,
          product_name: i.product_name + (i.size ? ` - ${i.size}` : ''), // Storing size in name for now
          quantity: i.quantity,
          unit_price: i.unit_price,
          tax_rate: 0,
          tax_amount: 0,
          total_amount: i.total_amount
        })));

      if (itemsError) throw itemsError;

      return { ...invoice, customItems: data.items }; // Return items for PDF gen
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invoices'] });
      toast.success("Custom Invoice created!");
      setSelectedOrderId(null); // Close dialog

      // Generate PDF immediately
      const pdfData = {
        orderId: invoice.id, // Use Invoice ID as Order ID for custom
        orderDate: format(new Date(), 'dd MMM yyyy'),
        customerName: customInvoice.customerName,
        customerAddress: {
          street: customInvoice.street,
          city: customInvoice.city,
          state: customInvoice.state,
          zip: customInvoice.zip,
          phone: customInvoice.phone,
        },
        items: customInvoice.items.map(i => ({
          name: i.name,
          size: i.size,
          color: "", // Custom bill might not need color tracking
          quantity: i.quantity,
          price: i.price
        })),
        subtotal: invoice.subtotal,
        shipping: 0,
        tax: 0,
        total: invoice.total_amount
      };

      generateInvoice(
        pdfData,
        invoice.invoice_number,
        {
          name: companySettings?.company_name || "Jager Clothing",
          address: companySettings?.address || "Your Address",
          city: companySettings?.city || "City",
          state: companySettings?.state || "State",
          zip: companySettings?.zip || "ZIP",
          phone: companySettings?.phone || "+91 XXXXX XXXXX",
          email: companySettings?.email || "info@jagerclothing.com",
          website: "",
          gstin: companySettings?.gstin || "",
          bank_name: companySettings?.bank_name,
          account_number: companySettings?.account_number,
          ifsc_code: companySettings?.ifsc_code,
          account_holder_name: companySettings?.account_holder_name,
        },
        0 // No tax
      );
    },
  });

  const addItemRow = () => {
    setCustomInvoice(prev => ({
      ...prev,
      items: [...prev.items, { name: "", size: "", quantity: 1, price: 0 }]
    }));
  };

  const removeItemRow = (index: number) => {
    setCustomInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...customInvoice.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setCustomInvoice(prev => ({ ...prev, items: newItems }));
  };

  const downloadInvoicePDF = async (invoice: Invoice) => {
    try {
      let orderData: any = {};
      let items: any[] = [];

      if (invoice.order_id) {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', invoice.order_id)
          .single();

        if (orderError || !order) {
          console.error("Order fetch error:", orderError);
          toast.error("Could not fetch order details");
          return;
        }

        orderData = order;
        items = (order.order_items || []).map((item: any) => ({
          name: item.product_name,
          size: item.size || "",
          color: item.color || "",
          quantity: item.quantity,
          price: Number(item.price),
        }));
      } else {
        // Fetch invoice items for custom invoice
        const { data: invItems, error: itemsError } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoice.id);

        if (itemsError) {
          console.error("Invoice items fetch error:", itemsError);
          toast.error("Could not fetch invoice items");
          return;
        }

        items = (invItems || []).map((item: any) => {
          // Parse size from name if possible "Name - Size"
          const nameParts = item.product_name.split(' - ');
          const likelySize = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
          const cleanName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' - ') : item.product_name;

          return {
            name: cleanName,
            size: likelySize,
            color: "",
            quantity: item.quantity,
            price: Number(item.unit_price)
          };
        });

        // Mock order data from invoice
        orderData = {
          created_at: invoice.invoice_date,
          subtotal: invoice.subtotal,
          shipping: invoice.shipping,
          tax: invoice.total_tax,
          total: invoice.total_amount
        };
      }

      if (!items || items.length === 0) {
        toast.error("No items found for this invoice");
        return;
      }

      generateInvoice(
        {
          orderId: invoice.order_id || invoice.invoice_number,
          orderDate: format(new Date(invoice.invoice_date), 'dd MMM yyyy'),
          customerName: invoice.billing_address?.full_name || "Customer",
          customerAddress: {
            street: invoice.billing_address?.street || "",
            city: invoice.billing_address?.city || "",
            state: invoice.billing_address?.state || "",
            zip: invoice.billing_address?.zip || "",
            phone: invoice.billing_address?.phone || "",
          },
          items: items,
          subtotal: Number(invoice.subtotal),
          shipping: Number(invoice.shipping),
          tax: Number(invoice.total_tax),
          total: Number(invoice.total_amount),
        },
        invoice.invoice_number,
        {
          name: companySettings?.company_name || "Jager Clothing",
          address: companySettings?.address || "Your Address",
          city: companySettings?.city || "City",
          state: companySettings?.state || "State",
          zip: companySettings?.zip || "ZIP",
          phone: companySettings?.phone || "+91 XXXXX XXXXX",
          email: companySettings?.email || "info@jagerclothing.com",
          website: "",
          gstin: companySettings?.gstin || "",
          bank_name: companySettings?.bank_name,
          account_number: companySettings?.account_number,
          ifsc_code: companySettings?.ifsc_code,
          account_holder_name: companySettings?.account_holder_name,
        },
        invoice.tax_rate
      );
    } catch (error: any) {
      console.error("Download invoice error:", error);
      toast.error("Failed to generate invoice: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* ... Header ... */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Billing & Invoices</h1>
          <p className="text-grey-text mt-1">Manage invoices and custom bills</p>
        </div>
        <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedOrderId("open")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold uppercase">Create New Invoice</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="order" onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="order">From Pending Order</TabsTrigger>
                <TabsTrigger value="custom">Custom Bill</TabsTrigger>
              </TabsList>

              <TabsContent value="order" className="space-y-4">
                <Label className="uppercase font-bold text-xs text-grey-text">Select Pending Order</Label>
                <Select value={selectedOrderId === "open" ? "" : selectedOrderId || ""} onValueChange={setSelectedOrderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {ordersWithoutInvoices?.map((order: any) => (
                      <SelectItem key={order.id} value={order.id}>
                        #{order.id.slice(0, 8)} - ₹{Number(order.total).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => selectedOrderId && selectedOrderId !== "open" && createInvoice.mutate(selectedOrderId)}
                  disabled={!selectedOrderId || selectedOrderId === "open" || createInvoice.isPending}
                  className="w-full"
                >
                  {createInvoice.isPending ? <Loader2 className="animate-spin mr-2" /> : "Generate from Order"}
                </Button>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Customer Name</Label>
                    <Input value={customInvoice.customerName} onChange={e => setCustomInvoice({ ...customInvoice, customerName: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="space-y-1">
                    <Label>Phone</Label>
                    <Input value={customInvoice.phone} onChange={e => setCustomInvoice({ ...customInvoice, phone: e.target.value })} placeholder="+91..." />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label>Street Address</Label>
                    <Input value={customInvoice.street} onChange={e => setCustomInvoice({ ...customInvoice, street: e.target.value })} placeholder="123 Main St" />
                  </div>
                  <div className="space-y-1">
                    <Label>City</Label>
                    <Input value={customInvoice.city} onChange={e => setCustomInvoice({ ...customInvoice, city: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>State</Label>
                      <Input value={customInvoice.state} onChange={e => setCustomInvoice({ ...customInvoice, state: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label>ZIP</Label>
                      <Input value={customInvoice.zip} onChange={e => setCustomInvoice({ ...customInvoice, zip: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-4">
                  <Label className="mb-2 block font-heading font-bold">Items</Label>
                  <div className="space-y-2">
                    {customInvoice.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Input placeholder="Item Name" value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} />
                        </div>
                        <div className="w-20">
                          <Input placeholder="Size" value={item.size} onChange={e => updateItem(idx, 'size', e.target.value)} />
                        </div>
                        <div className="w-16">
                          <Input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
                        </div>
                        <div className="w-24">
                          <Input type="number" placeholder="Price" value={item.price} onChange={e => updateItem(idx, 'price', Number(e.target.value))} />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeItemRow(idx)} disabled={customInvoice.items.length === 1}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addItemRow} className="w-full mt-2">
                      <Plus className="h-4 w-4 mr-2" /> Add Item
                    </Button>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center font-bold">
                  <span>Total:</span>
                  <span>₹{customInvoice.items.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}</span>
                </div>

                <Button onClick={() => createCustomInvoice.mutate(customInvoice)} disabled={createCustomInvoice.isPending} className="w-full bg-jager-red hover:bg-red-800">
                  {createCustomInvoice.isPending ? <Loader2 className="animate-spin mr-2" /> : "Generate & Save Invoice"}
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters... (unchanged) */}
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

