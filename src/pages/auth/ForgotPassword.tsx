import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setIsSent(true);
      toast.success("Password reset email sent!");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-heading mb-2">RESET PASSWORD</h1>
            <p className="text-muted-foreground">Enter your email to reset your password</p>
          </div>

          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">EMAIL</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="border-0 border-b border-foreground focus-visible:ring-0 focus-visible:border-accent px-0"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                We'll send you a link to reset your password.
              </p>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-foreground text-background hover:bg-foreground/90 btn-press"
                disabled={isLoading}
              >
                {isLoading ? "SENDING..." : "SEND RESET LINK"}
              </Button>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <p className="text-lg">
                Check your email for a password reset link. It may take a few minutes to arrive.
              </p>
              <Link to="/auth/login">
                <Button variant="outline">Back to Sign In</Button>
              </Link>
            </div>
          )}

          <div className="text-center text-sm">
            <Link to="/auth/login" className="text-accent hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;

