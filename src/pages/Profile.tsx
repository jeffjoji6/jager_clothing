import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Edit2, Trash2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  // Personal Info State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [addressForm, setAddressForm] = useState({
    full_name: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    type: "shipping" as "shipping" | "billing",
    is_default: false,
  });

  // Fetch data on mount
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "");
      setPhone(user.user_metadata?.phone || "");
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error: any) {
      toast.error("Failed to load addresses");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, phone },
      });

      if (error) throw error;
      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
    } catch (error: any) {
      toast.error("Failed to update profile", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAddress) {
        const { error } = await supabase
          .from("addresses")
          .update(addressForm)
          .eq("id", editingAddress.id);
        if (error) throw error;
        toast.success("Address updated");
      } else {
        const { error } = await supabase
          .from("addresses")
          .insert([{ ...addressForm, user_id: user?.id }]);
        if (error) throw error;
        toast.success("Address added");
      }

      setIsAddressDialogOpen(false);
      setEditingAddress(null);
      resetAddressForm();
      fetchAddresses();
    } catch (error: any) {
      toast.error("Failed to save address", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Address deleted");
      fetchAddresses();
    } catch (error: any) {
      toast.error("Failed to delete address");
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      full_name: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      type: "shipping",
      is_default: false,
    });
  };

  const openEditAddress = (address: any) => {
    setEditingAddress(address);
    setAddressForm({
      full_name: address.full_name,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      phone: address.phone,
      type: address.type,
      is_default: address.is_default,
    });
    setIsAddressDialogOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto px-4 py-8 md:py-12">
          <h1 className="text-3xl md:text-5xl font-heading font-bold uppercase tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            MY PROFILE
          </h1>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              <div className="border border-foreground p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-heading font-bold uppercase">PERSONAL INFORMATION</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                  >
                    {isEditingProfile ? "Cancel" : "Edit"}
                  </Button>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-heading font-bold uppercase">Email</Label>
                    <Input id="email" value={user?.email || ""} disabled className="mt-1 bg-muted" />
                  </div>

                  <div>
                    <Label htmlFor="fullName" className="text-sm font-heading font-bold uppercase">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!isEditingProfile || loading}
                      className="mt-1"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-heading font-bold uppercase">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={!isEditingProfile || loading}
                      className="mt-1"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {isEditingProfile && (
                    <Button type="submit" variant="hero" disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "SAVE CHANGES"}
                    </Button>
                  )}
                </form>
              </div>
            </div>

            {/* Address Book */}
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <div className="border border-foreground p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-heading font-bold uppercase">ADDRESS BOOK</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingAddress(null);
                      resetAddressForm();
                      setIsAddressDialogOpen(true);
                    }}
                  >
                    + Add New
                  </Button>
                </div>

                <div className="space-y-4">
                  {addresses.length === 0 ? (
                    <p className="text-sm text-grey-text italic">No addresses saved yet.</p>
                  ) : (
                    addresses.map((address) => (
                      <div key={address.id} className="bg-muted/30 p-4 rounded-md border border-border relative group transition-all hover:border-foreground">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditAddress(address)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="pr-16">
                          <p className="font-bold uppercase text-sm">{address.full_name}</p>
                          <p className="text-sm text-muted-foreground">{address.street}</p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}, {address.state} {address.zip}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{address.phone}</p>
                          {address.is_default && (
                            <span className="inline-block mt-2 text-[10px] font-bold uppercase bg-foreground text-background px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Address Dialog */}
        <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold uppercase">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddressSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="addr-name">Full Name</Label>
                  <Input
                    id="addr-name"
                    value={addressForm.full_name}
                    onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="addr-street">Street Address</Label>
                  <Input
                    id="addr-street"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="addr-city">City</Label>
                  <Input
                    id="addr-city"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="addr-state">State</Label>
                  <Input
                    id="addr-state"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="addr-zip">ZIP Code</Label>
                  <Input
                    id="addr-zip"
                    value={addressForm.zip}
                    onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="addr-phone">Phone</Label>
                  <Input
                    id="addr-phone"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddressDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="hero" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Address"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
};

export default Profile;

