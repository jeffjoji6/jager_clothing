import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Mail, User, ShoppingBag, DollarSign, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Customer {
  id: string;
  email: string;
  created_at: string;
  full_name?: string;
  is_subscribed?: boolean;
}

interface CustomerStats {
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
}

interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
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

  // Customers Selection
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());

  // Newsletter Selection
  const [selectedSubscriberEmails, setSelectedSubscriberEmails] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();

  // --- QUERY 1: CUSTOMERS (From Orders) ---
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
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
        }
      } catch (e) {
        console.error("Failed to call get_user_emails RPC", e);
      }

      // Get all subscriptions
      const { data: subscriptions } = await supabase
        .from('notification_subscriptions')
        .select('email, is_active')
        .eq('is_active', true);

      const subscriptionMap = new Set(subscriptions?.map(s => s.email.toLowerCase()));

      for (const item of customerArray) {
        const userAddress = addresses?.find(a => a.user_id === item.customer.id);
        if (userAddress) {
          item.customer.full_name = userAddress.full_name;
        }
        item.customer.email = emailMap[item.customer.id] || "Email not available";
        item.customer.is_subscribed = subscriptionMap.has(item.customer.email.toLowerCase());
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

  // Fetch customer orders for detail view
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


  // --- QUERY 2: SUBSCRIBERS (Directly from Notification Subscriptions) ---
  const { data: subscribers, isLoading: isLoadingSubscribers } = useQuery({
    queryKey: ['admin', 'newsletter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Subscriber[];
    }
  });


  // --- HANDLERS ---

  // Customer Selection
  const handleSelectAllCustomers = (checked: boolean) => {
    if (checked && customers) {
      setSelectedCustomerIds(new Set(customers.map(c => c.customer.id)));
    } else {
      setSelectedCustomerIds(new Set());
    }
  };

  const handleSelectCustomer = (id: string, checked: boolean) => {
    const newSet = new Set(selectedCustomerIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedCustomerIds(newSet);
  };

  // Subscriber Selection
  const handleSelectAllSubscribers = (checked: boolean) => {
    if (checked && subscribers) {
      setSelectedSubscriberEmails(new Set(subscribers.map(s => s.email)));
    } else {
      setSelectedSubscriberEmails(new Set());
    }
  };

  const handleSelectSubscriber = (email: string, checked: boolean) => {
    const newSet = new Set(selectedSubscriberEmails);
    if (checked) newSet.add(email);
    else newSet.delete(email);
    setSelectedSubscriberEmails(newSet);
  };


  const handleOpenEmailDialog = (customer?: Customer, isSubscriberList: boolean = false) => {
    if (customer) {
      // Single Customer mode
      setSelectedCustomer(customer);
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

  const handleExportSubscribers = () => {
    if (!subscribers || subscribers.length === 0) return;

    const csvContent = "data:text/csv;charset=utf-8,"
      + "Email,Status,Subscribed Date\n"
      + subscribers.map(s => `${s.email},${s.is_active ? 'Active' : 'Inactive'},${new Date(s.created_at).toLocaleDateString()}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Subscribers list exported!");
  };

  // Send email mutation
  const sendEmail = useMutation({
    mutationFn: async () => {
      let recipients: string[] = [];

      // Determine source of recipients
      // If we have selectedSubscriberEmails from the Newsletter tab, prioritize that?
      // Or we need to know WHICH tab triggered this.
      // Ideally, the "Send Bulk Email" button should call this with context.
      // But for simplicity, let's assume if selectedCustomer is null, we check both sets?
      // Actually, buttons are separate. Let's rely on checking which set is occupied.

      if (selectedCustomer) {
        recipients = [selectedCustomer.email];
      } else {
        // Check if we are sending to Customers or Subscribers
        // We can merge them if user selected from both, but usually it's one action.
        // Let's prioritize subscribers if that set is non-empty and we are in that context?
        // To be safe, let's just combine UNIQUE emails from both selections if both exist.

        const customerEmails = customers
          ?.filter(c => selectedCustomerIds.has(c.customer.id))
          .map(c => c.customer.email)
          .filter(email => email && email !== "Email not available") || [];

        const subscriberEmails = Array.from(selectedSubscriberEmails);

        // Merge unique
        const combined = new Set([...customerEmails, ...subscriberEmails]);
        recipients = Array.from(combined);
      }

      if (recipients.length === 0) {
        throw new Error("No recipients selected");
      }

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          recipients,
          subject: emailForm.subject,
          html: emailForm.body.replace(/\n/g, '<br>'),
        }
      });

      if (error) throw error;

      // Logging (Skipping for brevity/complexity in mixed mode, but you could add back)
    },
    onSuccess: () => {
      toast.success("Emails sent successfully!");
      setEmailDialogOpen(false);
      setSelectedCustomer(null);
      setSelectedCustomerIds(new Set());
      setSelectedSubscriberEmails(new Set());
    },
    onError: (err) => {
      toast.error("Failed to send emails: " + err.message);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">User Management</h1>
          <p className="text-grey-text mt-1">Manage customers and newsletter subscribers</p>
        </div>
      </div>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter Subscribers</TabsTrigger>
        </TabsList>

        {/* --- CUSTOMERS TAB --- */}
        <TabsContent value="customers" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-grey-text" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {selectedCustomerIds.size > 0 && (
              <Button onClick={() => handleOpenEmailDialog()}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email ({selectedCustomerIds.size})
              </Button>
            )}
          </div>

          <div className="bg-background border rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-muted/40 flex items-center gap-4">
              <Checkbox
                checked={customers && customers.length > 0 && selectedCustomerIds.size === customers.length}
                onCheckedChange={(checked) => handleSelectAllCustomers(!!checked)}
              />
              <span className="text-sm font-medium text-muted-foreground uppercase">Select All</span>
            </div>

            {isLoadingCustomers ? (
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
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-grey-text">{item.customer.email}</p>
                              {item.customer.is_subscribed && (
                                <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Subscribed</Badge>
                              )}
                            </div>
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
        </TabsContent>

        {/* --- NEWSLETTER TAB --- */}
        <TabsContent value="newsletter" className="space-y-4">
          <div className="flex justify-end gap-2">
            {selectedSubscriberEmails.size > 0 && (
              <Button onClick={() => setEmailDialogOpen(true)}>
                <Mail className="h-4 w-4 mr-2" /> Send to Selected ({selectedSubscriberEmails.size})
              </Button>
            )}
            <Button variant="outline" onClick={handleExportSubscribers} disabled={!subscribers?.length}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Subscribers ({subscribers?.length || 0})</CardTitle>
              <CardDescription>All users who have opted into marketing emails.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={subscribers && subscribers.length > 0 && selectedSubscriberEmails.size === subscribers.length}
                        onCheckedChange={(c) => handleSelectAllSubscribers(!!c)}
                      />
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscribed On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingSubscribers ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></TableCell>
                    </TableRow>
                  ) : subscribers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No subscribers yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscribers?.map(sub => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedSubscriberEmails.has(sub.email)}
                            onCheckedChange={(c) => handleSelectSubscriber(sub.email, !!c)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {sub.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${sub.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {sub.is_active ? 'Active' : 'Unsubscribed'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {format(new Date(sub.created_at), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


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
              {selectedCustomer
                ? `Send Email to ${selectedCustomer?.email}`
                : `Send Bulk Email to ${selectedCustomerIds.size + selectedSubscriberEmails.size} Recipients`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedCustomer && (
              <div className="bg-muted p-3 rounded text-sm">
                Sending to {selectedCustomerIds.size + selectedSubscriberEmails.size} recipients.
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

