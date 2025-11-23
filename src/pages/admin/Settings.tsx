import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Mail, Shield, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AdminUser {
  id: string;
  role: 'admin' | 'staff' | 'designer';
  permissions: Record<string, any>;
  email?: string;
}

const Settings = () => {
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'staff' | 'designer'>('staff');
  const queryClient = useQueryClient();

  // Fetch admin users
  const { data: adminUsers, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdminUser[];
    },
  });

  // Create admin user
  const createAdmin = useMutation({
    mutationFn: async () => {
      // First, we need to get the user by email
      // Note: This requires backend API or Supabase Admin API
      // For now, placeholder - you'd need to create user first via auth, then add to admin_users
      toast.info("Admin user creation requires backend API. User must be created in auth first.");
      
      // The flow should be:
      // 1. Create user via Supabase Auth Admin API (backend only)
      // 2. Insert into admin_users table
      
      throw new Error("Admin creation must be done via backend API");
    },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Settings</h1>
        <p className="text-grey-text mt-1">Configure your admin panel</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="email">Email Templates</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>

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
              <Dialog>
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
                      Note: User must already exist in the system. Admin creation requires backend API.
                    </p>
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
                        <p className="font-heading font-bold uppercase">{admin.id.slice(0, 8)}</p>
                        <p className="text-sm text-grey-text capitalize">Role: {admin.role}</p>
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
              <CardDescription>Configure shipping zones and rates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-grey-text text-sm">
                Shipping settings coming soon. Configure shipping zones, rates, and carriers.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

