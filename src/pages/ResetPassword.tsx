import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if we have hash fragments in the URL (Supabase redirect)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");
    const errorDescription = hashParams.get("error_description");

    if (errorDescription) {
      setError(decodeURIComponent(errorDescription));
      return;
    }

    // If we have hash fragments, handle the session
    if (accessToken && type === "recovery") {
      const refreshToken = hashParams.get("refresh_token");
      if (refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ error }) => {
          if (error) {
            setError("Invalid reset link. Please request a new password reset.");
          }
          // Clear the hash from URL
          window.history.replaceState(null, "", window.location.pathname);
        });
      }
    } else {
      // Check if we already have a session (from callback redirect)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          // No session and no hash - might be invalid link
          // Don't show error immediately, user might be typing password
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast.success("Password updated successfully!");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">

        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-md mx-auto text-center">
            <CheckCircle2 className="w-16 h-16 text-jager-red mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tight mb-2">
              PASSWORD RESET
            </h1>
            <p className="text-sm text-grey-text font-body mb-6">
              Your password has been successfully updated!
            </p>
            <p className="text-sm text-grey-text font-body">
              Redirecting to sign in...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tight mb-2">
              NEW PASSWORD
            </h1>
            <p className="text-sm text-grey-text font-body">
              Enter your new password below.
            </p>
          </div>

          {error && (
            <div className="bg-jager-red/10 border border-jager-red px-4 py-3 mb-6">
              <p className="text-sm font-body text-jager-red">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-heading font-bold uppercase">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full"
                minLength={6}
              />
              <p className="text-xs text-grey-text font-body">
                Must be at least 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-heading font-bold uppercase">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full"
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "UPDATE PASSWORD"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm font-body text-grey-text hover:text-foreground underline"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

