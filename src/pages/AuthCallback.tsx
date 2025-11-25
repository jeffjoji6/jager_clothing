import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");
        const error = hashParams.get("error");
        const errorDescription = hashParams.get("error_description");

        // Handle errors
        if (error) {
          setStatus("error");
          setMessage(errorDescription || "Authentication failed");
          toast.error("Authentication failed", { description: errorDescription });
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        // Handle password recovery
        if (type === "recovery") {
          // Extract the access token and store it
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              throw sessionError;
            }

            setStatus("success");
            setMessage("Redirecting to password reset...");
            navigate("/auth/reset-password");
            return;
          }
        }

        // Handle email confirmation/signup
        if (type === "signup" || accessToken) {
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              throw sessionError;
            }

            setStatus("success");
            setMessage("Email confirmed! Redirecting...");
            toast.success("Email confirmed successfully!");
            
            // Get user to check if they need to be redirected to a specific page
            const { data: { user } } = await supabase.auth.getUser();
            
            // Redirect to home or intended page
            setTimeout(() => navigate("/"), 2000);
            return;
          }
        }

        // If no tokens, try to get current session
        const { data: { session }, error: sessionCheckError } = await supabase.auth.getSession();
        
        if (session) {
          setStatus("success");
          setMessage("Already authenticated. Redirecting...");
          setTimeout(() => navigate("/"), 1500);
          return;
        }

        if (sessionCheckError) {
          throw sessionCheckError;
        }

        // No session found and no tokens
        setStatus("error");
        setMessage("No authentication data found");
        toast.error("Authentication failed", { description: "No authentication data found" });
        setTimeout(() => navigate("/login"), 3000);

      } catch (error: any) {
        console.error("Auth callback error:", error);
        setStatus("error");
        setMessage(error.message || "An error occurred");
        toast.error("Authentication failed", { description: error.message });
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-jager-red" />
            <p className="text-lg font-heading font-bold uppercase">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="h-8 w-8 mx-auto rounded-full bg-green-500 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-lg font-heading font-bold uppercase text-green-500">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="h-8 w-8 mx-auto rounded-full bg-red-500 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <p className="text-lg font-heading font-bold uppercase text-red-500">{message}</p>
            <p className="text-sm text-grey-text">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;

