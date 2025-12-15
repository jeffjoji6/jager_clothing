import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Mail, Shield, Plus, Trash2, Building2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface AdminUser {
  id: string;
  role: 'admin' | 'staff' | 'designer';
  permissions: Record<string, any>;
  email?: string;
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
  website: string;
  gstin: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  invoice_prefix: string;
  default_tax_rate: number;
  whatsapp_number: string;
  upi_id?: string;
  shipping_rate: number;
  free_shipping_threshold: number;
}

const Settings = () => {
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'staff' | 'designer'>('staff');
  const [companyInfo, setCompanyInfo] = useState<Partial<CompanySettings>>({});
  const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch company settings
  const { data: companySettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data as CompanySettings | null;
    },
  });

  // Update company info state when data loads
  useEffect(() => {
    if (companySettings) {
      setCompanyInfo(companySettings);
    }
  }, [companySettings]);

  // Update company settings
  const updateCompanySettings = useMutation({
    mutationFn: async (settings: Partial<CompanySettings>) => {
      // Sanitize payload to remove any unknown keys (like 'name' if it crept in)
      const validColumns = [
        'id', 'company_name', 'address', 'city', 'state', 'zip', 'phone', 'email',
        'website', 'gstin', 'bank_name', 'account_number', 'ifsc_code',
        'account_holder_name', 'invoice_prefix', 'default_tax_rate',
        'whatsapp_number', 'upi_id', 'shipping_rate', 'free_shipping_threshold'
      ];

      const payload: any = {
        id: '00000000-0000-0000-0000-000000000001',
        updated_at: new Date().toISOString(),
      };

      Object.keys(settings).forEach(key => {
        if (validColumns.includes(key)) {
          payload[key] = (settings as any)[key];
        }
      });

      const { data, error } = await supabase
        .from('company_settings')
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'company-settings'] });
      toast.success("Company settings updated successfully!");
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      toast.error("Failed to update settings: " + error.message);
    },
  });

  // Fetch admin users
  const { data: adminUsers, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const users = data as AdminUser[];

      // Fetch emails for these users
      const userIds = users.map(u => u.id);
      if (userIds.length > 0) {
        const { data: emails, error: emailError } = await supabase.rpc('get_user_emails', {
          user_ids: userIds
        });

        if (!emailError && emails) {
          const emailMap = new Map<string, string>();
          (emails as { id: string; email: string }[]).forEach((e) => {
            emailMap.set(e.id, e.email);
          });

          users.forEach(u => {
            u.email = emailMap.get(u.id);
          });
        }
      }

      return users;
    },
  });

  // Create admin user
  const createAdmin = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { data, error } = await supabase.rpc('add_admin_by_email', {
        user_email: email,
        admin_role: role
      });

      if (error) throw error;
      if (data && !data.success) {
        throw new Error(data.message || "Failed to add admin");
      }
      return data;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['admin', 'users'] });
      toast.success("Admin user added successfully");
      setNewAdminEmail("");
      setNewAdminRole('staff');
      setIsAddAdminDialogOpen(false); // Close the dialog
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  // Update admin role
  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { error } = await supabase
        .from('admin_users')
        .update({ role: newRole as any })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success("Role updated");
    },
  });

  // Delete admin user
  const deleteAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success("Admin user removed");
    },
  });

  const handleSaveCompanyInfo = () => {
    updateCompanySettings.mutate(companyInfo);
  };

  return (
    <div className="space-y-6">
      {/* ... existing headers ... */}

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company">Company Info</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="email">Email Templates</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>

        {/* Company Info */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading font-bold uppercase flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Manage company details, address, and bank account information</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSettings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="font-heading font-bold uppercase text-sm">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Company Name</Label>
                        <Input
                          value={companyInfo.company_name || ''}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, company_name: e.target.value })}
                          placeholder="Jager Clothing"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={companyInfo.email || ''}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                          placeholder="info@jagerclothing.com"
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={companyInfo.phone || ''}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                      <div>
                        <Label>WhatsApp Number</Label>
                        <Input
                          value={companyInfo.whatsapp_number || ''}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, whatsapp_number: e.target.value })}
                          placeholder="+91 98765 43210"
                        />
                        <p className="text-xs text-grey-text mt-1">Include country code (e.g. +91)</p>
                      </div>
                      <div>
                        <Label>Website</Label>
                        <Input
                          value={companyInfo.website || ''}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                          placeholder="www.jagerclothing.com"
                        />
                      </div>
                      <div>
                        <Label>GSTIN</Label>
                        <Input
                          value={companyInfo.gstin || ''}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, gstin: e.target.value })}
                          placeholder="GST Number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ... rest of the form ... */}
                  {/* I need to make sure I don't delete the rest of the file content. 
                      Since replace_file_content replaces a chunk, I'll match the Basic Info block properly.
                  */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-heading font-bold uppercase text-sm">Address</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label>Street Address</Label>
                        <Textarea
                          value={companyInfo.address || ''}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                          placeholder="123 Main Street"
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>City</Label>
                          <Input
                            value={companyInfo.city || ''}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                            placeholder="Mumbai"
                          />
                        </div>
                        <div>
                          <Label>State</Label>
                          <Input
                            value={companyInfo.state || ''}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, state: e.target.value })}
                            placeholder="Maharashtra"
                          />
                        </div>
                        <div>
                          <Label>ZIP Code</Label>
                          <Input
                            value={companyInfo.zip || ''}
                            onChange={(e) => setCompanyInfo({ ...companyInfo, zip: e.target.value })}
                            placeholder="400001"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-heading font-bold uppercase text-sm">Bank Account Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Bank Name</Label>
                        <Input
                          value={companyInfo.bank_name || ''}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, bank_name: e.target.value })}
                          placeholder="HDFC Bank"
                        />
                      </div>
                      <div>
                        <Label>Account Holder Name</Label>
                        <Input
                          value={companyInfo.account_holder_name || ''}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, account_holder_name: e.target.value })}
                          placeholder="Jager Clothing"
                        />
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <Input
                          value={companyInfo.account_number || ''}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, account_number: e.target.value })}
                          placeholder="XXXXXXXXXX1234"
                        />
                      </div>
                      <div>
                        <Label>IFSC Code</Label>
                        <Input
                          value={companyInfo.ifsc_code || ''}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, ifsc_code: e.target.value })}
                          placeholder="HDFC0001234"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>UPI ID</Label>
                        <Input
                          value={companyInfo.upi_id || ''}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, upi_id: e.target.value })}
                          placeholder="username@bank (e.g., jager@okhdfcbank)"
                        />
                        <p className="text-xs text-grey-text mt-1">This will be displayed on invoices for direct payments.</p>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Settings */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-heading font-bold uppercase text-sm">Invoice Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Invoice Prefix</Label>
                        <Input
                          value={companyInfo.invoice_prefix || ''}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, invoice_prefix: e.target.value })}
                          placeholder="INV"
                        />
                      </div>
                      <div>
                        <Label>Default Tax Rate (%)</Label>
                        <Input
                          type="number"
                          value={companyInfo.default_tax_rate || 0}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, default_tax_rate: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={handleSaveCompanyInfo}
                      disabled={updateCompanySettings.isPending}
                      className="bg-jager-red hover:bg-red-800"
                    >
                      {updateCompanySettings.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Company Info
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading font-bold uppercase flex items-center gap-2">
                <Users className="h-5 w-5" />
                Admin Users
              </CardTitle>
              <CardDescription>Manage admin panel access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={isAddAdminDialogOpen} onOpenChange={setIsAddAdminDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Admin User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-heading font-bold uppercase">Add Admin User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-heading font-bold uppercase">Email</Label>
                      <Input
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        type="email"
                        placeholder="user@example.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-heading font-bold uppercase">Role</Label>
                      <Select value={newAdminRole} onValueChange={(value: any) => setNewAdminRole(value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="designer">Designer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-grey-text">
                      Note: User must already be registered in the system.
                    </p>
                    <Button
                      className="w-full mt-2"
                      onClick={() => createAdmin.mutate({ email: newAdminEmail, role: newAdminRole })}
                      disabled={!newAdminEmail || createAdmin.isPending}
                    >
                      {createAdmin.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Add Admin
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : adminUsers && adminUsers.length > 0 ? (
                <div className="space-y-3">
                  {adminUsers.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-4 border border-foreground"
                    >
                      <div>
                        <p className="font-heading font-bold uppercase">{admin.email || `ID: ${admin.id.slice(0, 8)}`}</p>
                        <p className="text-sm text-grey-text capitalize">Role: {admin.role}</p>
                        {!admin.email && <p className="text-xs text-red-500">Email not found</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={admin.role}
                          onValueChange={(value) => updateRole.mutate({ userId: admin.id, newRole: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="designer">Designer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm("Remove admin access for this user?")) {
                              deleteAdmin.mutate(admin.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-grey-text text-sm">No admin users found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading font-bold uppercase flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>Manage email templates for customer communications</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-grey-text text-sm">
                Email template management coming soon. Configure email templates for order confirmations, shipping updates, etc.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading font-bold uppercase">Shipping Settings</CardTitle>
              <CardDescription>Configure shipping charges and free shipping thresholds</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSettings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Standard Shipping Rate (₹)</Label>
                      <Input
                        type="number"
                        value={companyInfo.shipping_rate || 0}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, shipping_rate: parseFloat(e.target.value) || 0 })}
                        placeholder="100"
                      />
                      <p className="text-xs text-grey-text mt-1">
                        Amount charged for shipping on standard orders.
                      </p>
                    </div>
                    <div>
                      <Label>Free Shipping Threshold (₹)</Label>
                      <Input
                        type="number"
                        value={companyInfo.free_shipping_threshold || 0}
                        onChange={(e) => setCompanyInfo({ ...companyInfo, free_shipping_threshold: parseFloat(e.target.value) || 0 })}
                        placeholder="499"
                      />
                      <p className="text-xs text-grey-text mt-1">
                        Orders above this subtotal amount will qualify for free shipping.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={handleSaveCompanyInfo}
                      disabled={updateCompanySettings.isPending}
                      className="bg-jager-red hover:bg-red-800"
                    >
                      {updateCompanySettings.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Shipping Settings
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

