import { useState } from "react";
import { X, Bell, Mail, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NotificationModal = ({ isOpen, onClose }: NotificationModalProps) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes("@")) {
            toast.error("Please enter a valid email address");
            return;
        }

        setLoading(true);

        try {
            // Check if email already exists
            const { data: existing } = await supabase
                .from("notification_subscriptions")
                .select("id, is_active")
                .eq("email", email.toLowerCase())
                .single();

            if (existing) {
                if (existing.is_active) {
                    toast.info("You're already subscribed to updates!");
                    setSubscribed(true);
                } else {
                    // Reactivate subscription
                    const { error } = await supabase
                        .from("notification_subscriptions")
                        .update({ is_active: true })
                        .eq("email", email.toLowerCase());

                    if (error) throw error;

                    toast.success("Welcome back! You're subscribed again.");
                    setSubscribed(true);
                }
            } else {
                // New subscription
                const { error } = await supabase
                    .from("notification_subscriptions")
                    .insert([{ email: email.toLowerCase() }]);

                if (error) throw error;

                toast.success("Successfully subscribed! You'll get updates on new drops and exclusive offers.");
                setSubscribed(true);
            }

            setTimeout(() => {
                onClose();
                setEmail("");
                setSubscribed(false);
            }, 2000);
        } catch (error: any) {
            console.error("Subscription error:", error);
            toast.error("Failed to subscribe. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-heading uppercase">
                        <Bell className="h-5 w-5 text-jager-red" />
                        Get Updates
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Subscribe to receive notifications about new drops, exclusive offers, and restocks.
                    </DialogDescription>
                </DialogHeader>

                {subscribed ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Check className="h-8 w-8 text-green-500" />
                        </div>
                        <p className="text-center font-medium">You're all set!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubscribe} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="notification-email" className="text-base">
                                Email Address
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="notification-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-12 text-base"
                                    required
                                />
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            We respect your privacy. Unsubscribe anytime. No spam, just premium updates.
                        </p>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-bold"
                            disabled={loading}
                        >
                            {loading ? "Subscribing..." : "Subscribe to Updates"}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};
