import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const { signIn, signInWithMagicLink } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (!error) {
      navigate(from, { replace: true });
    }

    setIsLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signInWithMagicLink(email);

    if (!error) {
      setShowMagicLink(true);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-heading mb-2">SIGN IN</h1>
            <p className="text-muted-foreground">Welcome back to Jager</p>
          </div>

          {!showMagicLink ? (
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

              <div className="space-y-2">
                <Label htmlFor="password">PASSWORD</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="border-0 border-b border-foreground focus-visible:ring-0 focus-visible:border-accent px-0"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link
                  to="/auth/forgot-password"
                  className="text-accent hover:underline"
                >
                  Forgot password?
                </Link>
                <button
                  type="button"
                  onClick={() => setShowMagicLink(true)}
                  className="text-accent hover:underline"
                >
                  Use magic link instead
                </button>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-foreground text-background hover:bg-foreground/90 btn-press"
                disabled={isLoading}
              >
                {isLoading ? "SIGNING IN..." : "SIGN IN"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="magic-email">EMAIL</Label>
                <Input
                  id="magic-email"
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
                We'll send you a magic link to sign in without a password.
              </p>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowMagicLink(false)}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 bg-foreground text-background hover:bg-foreground/90 btn-press"
                  disabled={isLoading}
                >
                  {isLoading ? "SENDING..." : "SEND MAGIC LINK"}
                </Button>
              </div>
            </form>
          )}

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/auth/signup" className="text-accent hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;

