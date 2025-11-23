import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const Profile = () => {
  const { user, loading } = useAuth();
  const [updating, setUpdating] = useState(false);

  if (loading) {
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
          <h1 className="text-3xl md:text-5xl font-heading font-bold uppercase tracking-tight mb-8">
            MY PROFILE
          </h1>

          <div className="max-w-2xl space-y-8">
            <div className="border border-foreground p-6 space-y-4">
              <h2 className="text-xl font-heading font-bold uppercase mb-4">ACCOUNT INFORMATION</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-heading font-bold uppercase">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="mt-1"
                  />
                  <p className="text-xs text-grey-text mt-1">Email cannot be changed</p>
                </div>
              </div>
            </div>

            <div className="border border-foreground p-6 space-y-4">
              <h2 className="text-xl font-heading font-bold uppercase mb-4">QUICK LINKS</h2>
              <div className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/orders">MY ORDERS</Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/checkout">MANAGE ADDRESSES</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Profile;

