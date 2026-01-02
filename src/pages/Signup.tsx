import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ScrollReveal } from "@/components/ScrollReveal";

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification State
  const [verificationStep, setVerificationStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (verificationStep && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [verificationStep, timer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    // Check if user already exists using our custom RPC function
    try {
      const { data: emailExists, error: checkError } = await supabase.rpc('check_email_exists', {
        email_check: formData.email,
      });

      if (checkError) {
        console.error("Error checking email:", checkError);
        // Continue with signup if check fails, fallback to default error handling
      } else if (emailExists) {
        toast.error("Account already exists", {
          description: "Please sign in instead.",
          action: {
            label: "Sign In",
            onClick: () => navigate("/login"),
          },
        });
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Unexpected error checking email:", err);
    }

    // Sign up the user
    const { error } = await signUp(formData.email, formData.password, {
      full_name: formData.fullName,
    });

    if (error) {
      // Fallback error handling
      if (error.message.includes("already registered") || error.message.includes("User already exists")) {
        toast.error("Account already exists", {
          description: "Please sign in instead.",
          action: {
            label: "Sign In",
            onClick: () => navigate("/login"),
          },
        });
      } else {
        toast.error("Signup failed", { description: error.message });
      }
      setLoading(false);
      return;
    }

    // If successful, move to verification step
    setVerificationStep(true);
    setTimer(60); // Start timer
    setCanResend(false);
    setLoading(false);
    toast.success("Account created!", { description: "Please check your email for the verification code." });
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: formData.email,
    });

    if (error) {
      toast.error("Failed to resend code", { description: error.message });
    } else {
      toast.success("Code resent!", { description: "Check your email for the new code." });
      setTimer(60);
      setCanResend(false);
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error("Please enter the verification code");
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otpCode,
        type: "signup",
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Email verified successfully!");
        navigate("/"); // Navigate directly to store/home
      }
    } catch (error: any) {
      toast.error("Verification failed", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-12 md:py-16">
        <ScrollReveal variant="fade-up" className="max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tight mb-2">
              {verificationStep ? "VERIFY EMAIL" : "CREATE ACCOUNT"}
            </h1>
            <p className="text-sm text-grey-text font-body">
              {verificationStep
                ? `Enter the code sent to ${formData.email}`
                : "Join Jager Clothing today"
              }
            </p>
          </div>

          {!verificationStep ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-heading font-bold uppercase">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-heading font-bold uppercase">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-heading font-bold uppercase">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={loading}
                    className="w-full pr-10"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-grey-text font-body">
                  Must be at least 6 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-heading font-bold uppercase">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={loading}
                    className="w-full pr-10"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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
                    Creating account...
                  </>
                ) : (
                  "CREATE ACCOUNT"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-heading font-bold uppercase">
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="000000"
                  required
                  disabled={loading}
                  className="w-full text-center tracking-widest text-lg"
                  maxLength={6}
                />
              </div>

              <div className="flex flex-col space-y-4">
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
                      Verifying...
                    </>
                  ) : (
                    "VERIFY EMAIL"
                  )}
                </Button>

                <div className="text-center pt-2">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-sm font-heading font-bold uppercase hover:text-jager-red underline transition-colors"
                      disabled={loading}
                    >
                      Resend Code
                    </button>
                  ) : (
                    <p className="text-xs text-muted-foreground font-body">
                      Resend code in <span className="font-mono">{timer}s</span>
                    </p>
                  )}
                </div>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm font-body text-grey-text">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-heading font-bold uppercase hover:text-jager-red underline"
              >
                SIGN IN
              </Link>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

export default Signup;

