import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Mail, User, ShoppingBag, DollarSign } from "lucide-react";
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

interface Customer {
  id: string;
  email: string;
  created_at: string;
  full_name?: string;
}

interface CustomerStats {
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
}

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: "",
    body: "",
    emailType: "promotional",
  });
  const queryClient = useQueryClient();

  // Fetch customers with stats
  const { data: customers, isLoading } = useQuery({
    queryKey: ['admin', 'customers', searchQuery],
    queryFn: async () => {
      // Get all orders grouped by user
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, total, created_at')
        .not('user_id', 'is', null);

      // Aggregate customer data
      const customerMap = new Map<string, CustomerStats & { customer: Customer }>();
      
      orders?.forEach((order) => {
        if (!order.user_id) return;
        
        const existing = customerMap.get(order.user_id) || {
          total_orders: 0,
          total_spent: 0,
          last_order_date: null,
          customer: { id: order.user_id, email: '', created_at: '' },
        };
        
        customerMap.set(order.user_id, {
          total_orders: existing.total_orders + 1,
          total_spent: existing.total_spent + Number(order.total || 0),
          last_order_date: order.created_at > (existing.last_order_date || '') 
            ? order.created_at 
            : existing.last_order_date,
          customer: existing.customer,
        });
      });

      // Get user emails from addresses table (which has user_id)
      const { data: addresses } = await supabase
        .from('addresses')
        .select('user_id, full_name');

      const customerArray = Array.from(customerMap.values());
      for (const item of customerArray) {
        // Try to get email from user metadata in orders
        // Note: In production, you'd want a backend API to get user emails
        // For now, we'll use a workaround - store email in order metadata or addresses
        const userAddress = addresses?.find(a => a.user_id === item.customer.id);
        if (userAddress) {
          item.customer.full_name = userAddress.full_name;
        }
        // Email would need to be fetched from a backend API or stored differently
        item.customer.email = `user_${item.customer.id.slice(0, 8)}@customer.com`; // Placeholder
      }

      // Filter by search query
      let filtered = customerArray.filter((item) => {
        const email = item.customer.email.toLowerCase();
        const name = (item.customer.full_name || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return email.includes(query) || name.includes(query);
      });

      return filtered.sort((a, b) => b.total_spent - a.total_spent);
    },
  });

  // Fetch customer orders
  const { data: customerOrders } = useQuery({
    queryKey: ['admin', 'customer', selectedCustomer?.id, 'orders'],
    queryFn: async () => {
      if (!selectedCustomer) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', selectedCustomer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedCustomer,
  });

  // Send email mutation
  const sendEmail = useMutation({
    mutationFn: async () => {
      if (!selectedCustomer) return;

      // In production, this would call your email service (SendGrid, Resend, etc.)
      // For now, we'll just log it and save to database
      
      // Save email to database
      const { error } = await supabase
        .from('customer_emails')
        .insert({
          customer_id: selectedCustomer.id,
          email: selectedCustomer.email,
          subject: emailForm.subject,
          body: emailForm.body,
          email_type: emailForm.emailType,
          status: 'sent',
        });

      if (error) throw error;

      // TODO: Actually send email via your email service
      // Example: await resend.emails.send({ ... });
    },
    onSuccess: () => {
      toast.success("Email sent successfully!");
      setEmailDialogOpen(false);
      setEmailForm({ subject: "", body: "", emailType: "promotional" });
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
    },
  });

  const handleSendEmail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEmailForm({
      subject: "",
      body: "",
      emailType: "promotional",
    });
    setEmailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Customers</h1>
          <p className="text-grey-text mt-1">Manage your customer database</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-grey-text" />
            <Input
              placeholder="Search customers by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : customers && customers.length > 0 ? (
        <div className="grid gap-4">
          {customers.map((item) => (
            <Card key={item.customer.id}>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-grey-bg rounded-full flex items-center justify-center">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-heading font-bold uppercase">
                          {item.customer.full_name || "Customer"}
                        </p>
                        <p className="text-sm text-grey-text">{item.customer.email}</p>
                        {item.customer.created_at && (
                          <p className="text-xs text-grey-text">
                            Joined {format(new Date(item.customer.created_at), 'MMM yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingBag className="h-4 w-4 text-grey-text" />
                      <span className="text-sm text-grey-text">Orders:</span>
                      <span className="font-heading font-bold">{item.total_orders}</span>
                    </div>
                    {item.last_order_date && (
                      <p className="text-xs text-grey-text">
                        Last order: {format(new Date(item.last_order_date), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-grey-text" />
                      <span className="text-sm text-grey-text">Lifetime Value:</span>
                      <span className="font-heading font-bold text-lg">
                        ₹{item.total_spent.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(item.customer);
                      }}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendEmail(item.customer)}
                    >
                      <Mail className="h-4 w-4" />
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
            <p className="text-grey-text">No customers found</p>
          </CardContent>
        </Card>
      )}

      {/* Customer Detail Dialog */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer && !emailDialogOpen} onOpenChange={(open) => {
          if (!open) setSelectedCustomer(null);
        }}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold uppercase">
                Customer: {selectedCustomer.full_name || selectedCustomer.email}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-heading font-bold uppercase">Contact Information</Label>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">Email: {selectedCustomer.email}</p>
                  {selectedCustomer.full_name && (
                    <p className="text-sm">Name: {selectedCustomer.full_name}</p>
                  )}
                </div>
              </div>

              {/* Order History */}
              <div>
                <Label className="text-sm font-heading font-bold uppercase mb-3 block">Order History</Label>
                {customerOrders && customerOrders.length > 0 ? (
                  <div className="space-y-3">
                    {customerOrders.map((order: any) => (
                      <Link
                        key={order.id}
                        to={`/admin/orders/${order.id}`}
                        className="flex items-center justify-between p-3 border border-foreground hover:bg-grey-bg transition-colors"
                      >
                        <div>
                          <p className="font-heading font-bold uppercase text-sm">
                            Order #{order.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-grey-text">
                            {format(new Date(order.created_at), 'MMM dd, yyyy')} | {order.status}
                          </p>
                        </div>
                        <p className="font-heading font-bold">₹{Number(order.total).toLocaleString()}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-grey-text">No orders yet</p>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedCustomer(null);
                  handleSendEmail(selectedCustomer);
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Send Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading font-bold uppercase">Send Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-heading font-bold uppercase">To</Label>
              <Input
                value={selectedCustomer?.email || ""}
                disabled
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-heading font-bold uppercase">Email Type</Label>
              <Select
                value={emailForm.emailType}
                onValueChange={(value) => setEmailForm({ ...emailForm, emailType: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="promotional">Promotional</SelectItem>
                  <SelectItem value="order_confirmation">Order Confirmation</SelectItem>
                  <SelectItem value="shipping_update">Shipping Update</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-heading font-bold uppercase">Subject</Label>
              <Input
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                placeholder="Email subject"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-heading font-bold uppercase">Message</Label>
              <Textarea
                value={emailForm.body}
                onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                placeholder="Email message..."
                rows={8}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEmailDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => sendEmail.mutate()}
                disabled={sendEmail.isPending || !emailForm.subject || !emailForm.body}
                className="flex-1"
              >
                {sendEmail.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-grey-text">
              Note: Email sending requires backend email service configuration (SendGrid, Resend, etc.)
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;

