import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Mail, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP State
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("otp");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/";

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (!error) {
      navigate(from, { replace: true });
    }

    setLoading(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Only allow existing users to login? Or true for magic link signup? Let's default to true/default behavior.
        // Actually, for login, we might want to allow signup too, or strictly login. 
        // Supabase default handles both.
      },
    });

    if (error) {
      toast.error("Failed to send OTP", { description: error.message });
    } else {
      setOtpSent(true);
      setTimer(60);
      setCanResend(false);
      toast.success("OTP Sent", { description: "Check your email for the code" });
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (error) {
      toast.error("Failed to resend OTP", { description: error.message });
    } else {
      setTimer(60);
      setCanResend(false);
      toast.success("OTP Resent", { description: "Check your email for the new code" });
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error("Please enter the code");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: "email",
    });

    if (error) {
      toast.error("Invalid OTP", { description: error.message });
    } else if (data.session) {
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tight mb-2">
              WELCOME BACK
            </h1>
            <p className="text-sm text-grey-text font-body">
              Sign in to access your account
            </p>
          </div>

          <div className="space-y-6">
            {/* Custom Animated Tabs */}
            <div className="relative p-1 bg-muted rounded-lg grid grid-cols-2 gap-1">
              <div
                className={`absolute inset-y-1 w-[calc(50%-4px)] bg-background rounded-md shadow-sm transition-all duration-300 ease-in-out ${loginMethod === "password" ? "left-1" : "left-[calc(50%+2px)]"
                  }`}
              />
              <button
                onClick={() => setLoginMethod("password")}
                className={`relative z-10 text-sm font-medium py-2 transition-colors duration-200 ${loginMethod === "password" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Password
              </button>
              <button
                onClick={() => setLoginMethod("otp")}
                className={`relative z-10 text-sm font-medium py-2 transition-colors duration-200 ${loginMethod === "otp" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                One-Time Password
              </button>
            </div>

            <div className="relative overflow-hidden min-h-[300px]">
              {/* Password Login Form */}
              <div
                className={`transition-all duration-300 ease-in-out absolute inset-0 ${loginMethod === "password"
                  ? "opacity-100 translate-x-0 pointer-events-auto"
                  : "opacity-0 -translate-x-full pointer-events-none"
                  }`}
              >
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-heading font-bold uppercase">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-heading font-bold uppercase">
                        Password
                      </Label>
                      <Link
                        to="/auth/forgot-password"
                        className="text-xs text-grey-text hover:text-jager-red transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full pr-10 h-12 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                        Signing in...
                      </>
                    ) : (
                      "SIGN IN"
                    )}
                  </Button>
                </form>
              </div>

              {/* OTP Login Form */}
              <div
                className={`transition-all duration-300 ease-in-out absolute inset-0 ${loginMethod === "otp"
                  ? "opacity-100 translate-x-0 pointer-events-auto"
                  : "opacity-0 translate-x-full pointer-events-none"
                  }`}
              >
                {/* OTP Form Content (Same as before but wrapped in this div) */}
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp-email" className="text-sm font-heading font-bold uppercase">
                        Email
                      </Label>
                      <Input
                        id="otp-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="w-full h-12 text-base"
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
                          Sending Code...
                        </>
                      ) : (
                        "SEND LOGIN CODE"
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="otp-code" className="text-sm font-heading font-bold uppercase">
                        Verification Code
                      </Label>
                      <Input
                        id="otp-code"
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="000000"
                        required
                        disabled={loading}
                        className="w-full text-center tracking-widest text-lg h-12"
                        maxLength={6}
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Enter the 6-digit code sent to your email
                      </p>
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
                          "VERIFY & LOGIN"
                        )}
                      </Button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className={`text-sm font-heading font-bold uppercase underline transition-colors ${canResend
                            ? "text-foreground hover:text-jager-red cursor-pointer"
                            : "text-muted-foreground cursor-not-allowed opacity-50"
                            }`}
                          disabled={!canResend || loading}
                        >
                          Resend Code {canResend ? "" : `(${timer}s)`}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-full text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      Use a different email
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm font-body text-grey-text">
              Don't have an account?
            </p>
            <Link
              to="/signup"
              className="inline-block px-8 py-3 border-2 border-foreground text-foreground font-heading font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
            >
              CREATE ACCOUNT
            </Link>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Login;

