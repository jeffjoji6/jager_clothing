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
import { Checkbox } from "@/components/ui/checkbox";
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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null); // For single view
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: "",
    body: "",
    emailType: "promotional",
  });
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
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

      // Get user addresses for names
      const { data: addresses } = await supabase
        .from('addresses')
        .select('user_id, full_name');

      const customerArray = Array.from(customerMap.values());

      // Collect IDs to fetch emails
      const userIds = customerArray.map(c => c.customer.id);

      let emailMap: Record<string, string> = {};
      try {
        const { data: emailData, error } = await supabase.rpc('get_user_emails', {
          user_ids: userIds
        });

        if (!error && emailData) {
          emailData.forEach((u: { id: string, email: string }) => {
            emailMap[u.id] = u.email;
          });
        } else if (error) {
          console.error("Failed to fetch emails via RPC", error);
        }
      } catch (e) {
        console.error("Failed to call get_user_emails RPC", e);
      }

      for (const item of customerArray) {
        const userAddress = addresses?.find(a => a.user_id === item.customer.id);
        if (userAddress) {
          item.customer.full_name = userAddress.full_name;
        }
        // Use real email if available
        item.customer.email = emailMap[item.customer.id] || "Email not available";
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

  // Fetch customer orders (kept same)
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

  // Bulk / Single Email Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked && customers) {
      setSelectedCustomerIds(new Set(customers.map(c => c.customer.id)));
    } else {
      setSelectedCustomerIds(new Set());
    }
  };

  const handleSelectCustomer = (id: string, checked: boolean) => {
    const newSet = new Set(selectedCustomerIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedCustomerIds(newSet);
  };

  const handleOpenEmailDialog = (customer?: Customer) => {
    if (customer) {
      // Single mode
      setSelectedCustomer(customer);
      // Ensure specific selection is cleared if we are doing single action, 
      // or just treat single action as a specific case.
      // Let's decide: "Send Email" on a row means sending to just that one.
    } else {
      // Bulk mode
      setSelectedCustomer(null);
    }

    setEmailForm({
      subject: "",
      body: "",
      emailType: "promotional",
    });
    setEmailDialogOpen(true);
  };

  // Send email mutation
  const sendEmail = useMutation({
    mutationFn: async () => {
      let recipients: string[] = [];
      let recipientIds: string[] = [];

      if (selectedCustomer) {
        // Single
        recipients = [selectedCustomer.email];
        recipientIds = [selectedCustomer.id];
      } else {
        // Bulk
        if (selectedCustomerIds.size === 0) return;
        // Find emails for selected IDs
        recipients = customers
          ?.filter(c => selectedCustomerIds.has(c.customer.id))
          .map(c => c.customer.email)
          .filter(email => email && email !== "Email not available") || [];

        recipientIds = Array.from(selectedCustomerIds);
      }

      if (recipients.length === 0) {
        throw new Error("No valid recipients found");
      }

      // 1. Call Edge Function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          recipients,
          subject: emailForm.subject,
          html: emailForm.body.replace(/\n/g, '<br>'), // Simple text to html
        }
      });

      if (error) throw error;

      // 2. Log to database (optional: iterate or just log one generic entry? Better to log per user if possible, 
      // or we can just log a bulk entry if we had a bulk table. 
      // For now, let's just log efficiently or skip individual logging for massive bulk to avoid 1000 inserts.)

      // Let's log individually for small batches, but for now we might skip logging 
      // or just log "Bulk Email Sent" to a system log if we had one.
      // The schema has `customer_emails` linked to `customer_id`.

      const emailLogs = recipientIds.map(id => ({
        customer_id: id,
        email: recipients.find((_, idx) => recipientIds[idx] === id) || "", // Approximation if indices match
        subject: emailForm.subject,
        body: emailForm.body,
        email_type: emailForm.emailType,
        status: 'sent',
      }));

      // Find the email for each ID correctly
      const logsToInsert = customers
        ?.filter(c => recipientIds.includes(c.customer.id))
        .map(c => ({
          customer_id: c.customer.id,
          email: c.customer.email,
          subject: emailForm.subject,
          body: emailForm.body,
          email_type: emailForm.emailType,
          status: 'sent'
        })) || [];

      if (logsToInsert.length > 0) {
        const { error: dbError } = await supabase
          .from('customer_emails')
          .insert(logsToInsert);

        if (dbError) console.error("Failed to log emails", dbError);
      }
    },
    onSuccess: () => {
      toast.success("Emails sent successfully!");
      setEmailDialogOpen(false);
      setSelectedCustomer(null);
      setSelectedCustomerIds(new Set()); // unique clear on success
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
    },
    onError: (err) => {
      toast.error("Failed to send emails: " + err.message);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Customers</h1>
          <p className="text-grey-text mt-1">Manage your customer database</p>
        </div>
        {selectedCustomerIds.size > 0 && (
          <Button onClick={() => handleOpenEmailDialog()}>
            <Mail className="h-4 w-4 mr-2" />
            Send Bulk Email ({selectedCustomerIds.size})
          </Button>
        )}
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
      <div className="bg-background border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-muted/40 flex items-center gap-4">
          <Checkbox
            checked={customers && customers.length > 0 && selectedCustomerIds.size === customers.length}
            onCheckedChange={(checked) => handleSelectAll(!!checked)}
          />
          <span className="text-sm font-medium text-muted-foreground uppercase">Select All</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : customers && customers.length > 0 ? (
          <div className="divide-y">
            {customers.map((item) => (
              <div key={item.customer.id} className="p-4 hover:bg-muted/50 flex items-center gap-4">
                <Checkbox
                  checked={selectedCustomerIds.has(item.customer.id)}
                  onCheckedChange={(checked) => handleSelectCustomer(item.customer.id, !!checked)}
                />

                <div className="flex-1 grid md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-grey-bg rounded-full flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-heading font-bold uppercase text-sm">
                          {item.customer.full_name || "Customer"}
                        </p>
                        <p className="text-sm text-grey-text">{item.customer.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-sm font-medium">{item.total_orders} Orders</p>
                    {item.last_order_date && (
                      <p className="text-xs text-grey-text">
                        Last: {format(new Date(item.last_order_date), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-3">
                    <p className="font-heading font-bold">
                      ₹{item.total_spent.toLocaleString()}
                    </p>
                    <p className="text-xs text-grey-text">Lifetime Value</p>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCustomer(item.customer)}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEmailDialog(item.customer)}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-grey-text">No customers found</div>
        )}
      </div>

      {/* Customer Detail Dialog */}
      {selectedCustomer && !emailDialogOpen && (
        <Dialog open={!!selectedCustomer} onOpenChange={(open) => {
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
                onClick={() => handleOpenEmailDialog(selectedCustomer)}
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
            <DialogTitle className="font-heading font-bold uppercase">
              {selectedCustomer ? `Send Email to ${selectedCustomer?.email}` : `Send Bulk Email to ${selectedCustomerIds.size} Customers`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedCustomer && (
              <div className="bg-muted p-3 rounded text-sm">
                Sending to {selectedCustomerIds.size} recipients.
              </div>
            )}

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
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="update">General Update</SelectItem>
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;

