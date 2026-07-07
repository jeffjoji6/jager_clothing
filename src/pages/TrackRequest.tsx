import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, Package, Clock, CheckCircle2, XCircle, HelpCircle, Truck, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    new: { label: "Request Received", color: "bg-blue-500", icon: Clock },
    contacted: { label: "Consultation Started", color: "bg-yellow-500", icon: HelpCircle },
    quoted: { label: "Quote Shared", color: "bg-purple-500", icon: HelpCircle },
    sample: { label: "Design Mockup Ready", color: "bg-cyan-500", icon: Package },
    in_progress: { label: "In Production", color: "bg-orange-500", icon: Package },
    production: { label: "In Production", color: "bg-orange-500", icon: Package },
    shipped: { label: "Shipped", color: "bg-indigo-500", icon: Truck },
    completed: { label: "Completed", color: "bg-green-500", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", color: "bg-red-500", icon: XCircle },
};

export default function TrackRequest() {
    const [loading, setLoading] = useState(false);
    const [refId, setRefId] = useState("");
    const [result, setResult] = useState<any | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const { data, error } = await supabase.rpc('get_status_by_ref', {
                ref_input: refId.trim().toUpperCase()
            });

            if (error) throw error;

            if (data && data.length > 0) {
                setResult(data[0]);
                toast.success("Request found!");
            } else {
                toast.error("Request not found. Please check your Reference ID.");
            }
        } catch (err: any) {
            console.error("Tracking Error:", err);
            toast.error("Failed to track request. Please check inputs.");
        } finally {
            setLoading(false);
        }
    };

    const StatusIcon = result ? statusConfig[result.status]?.icon : null;

    return (
        <div className="min-h-screen text-foreground relative overflow-hidden bg-background flex flex-col">
            <Helmet>
                <title>Track Request | Jager Clothing</title>
            </Helmet>

            <main className="flex-1 flex flex-col items-center justify-center p-4 py-20 relative">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-jager-red/5 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px]" />
                </div>

                <div className="container max-w-lg">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase tracking-tight mb-4">Track Your Request</h1>
                        <p className="text-muted-foreground">Enter your Reference ID (e.g., BLK-123456) to check the status.</p>
                    </div>

                    <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-2xl">
                        <CardContent className="p-6 md:p-8">
                            <form onSubmit={handleSearch} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Reference ID</Label>
                                        <Input
                                            required
                                            value={refId}
                                            onChange={e => setRefId(e.target.value)}
                                            placeholder="e.g. CD-955773"
                                            className="h-12 bg-background/50 font-mono text-center text-lg uppercase tracking-widest placeholder:text-sm placeholder:normal-case placeholder:tracking-normal"
                                            maxLength={12}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-wide rounded-lg"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Track Status"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Result Display */}
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8"
                        >
                            <Card className="border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden">
                                <div className={`h-2 w-full ${statusConfig[result.status]?.color || 'bg-gray-500'}`} />
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${statusConfig[result.status]?.color} bg-opacity-20 text-current`}>
                                            {StatusIcon && <StatusIcon className={`w-6 h-6 ${statusConfig[result.status]?.color.replace('bg-', 'text-')}`} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-heading font-bold uppercase text-lg">Status</h3>
                                                <Badge className={`${statusConfig[result.status]?.color || 'bg-gray-500'} text-white`}>
                                                    {statusConfig[result.status]?.label || result.status}
                                                </Badge>
                                            </div>

                                            <div className="space-y-3 mt-4 pt-4 border-t border-border/50 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Submitted on</span>
                                                    <span className="font-medium">{format(new Date(result.created_at), 'PPP')}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Email</span>
                                                    <span className="font-medium">{result.user_email || 'N/A'}</span>
                                                </div>

                                                {/* Shipment Tracking Section */}
                                                {result.tracking_number && (
                                                    <div className="pt-3 border-t border-border/50">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Truck className="w-4 h-4 text-grey-text" />
                                                            <span className="text-muted-foreground font-medium">Shipment Tracking</span>
                                                        </div>
                                                        <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs text-muted-foreground">AWB Number</span>
                                                                <span className="font-mono font-bold text-sm">{result.tracking_number}</span>
                                                            </div>
                                                            {result.shipped_on && (
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs text-muted-foreground">Shipped On</span>
                                                                    <span className="text-xs font-medium">{format(new Date(result.shipped_on), 'PPP')}</span>
                                                                </div>
                                                            )}
                                                            <Button
                                                                onClick={() => {
                                                                    const trackingUrl = result.tracking_url || `https://shiprocket.co/tracking/${result.tracking_number}`;
                                                                    window.open(trackingUrl, '_blank');
                                                                }}
                                                                className="w-full mt-2 bg-jager-red hover:bg-jager-red/90 text-white"
                                                                size="sm"
                                                            >
                                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                                Track Shipment
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="pt-2">
                                                    <span className="text-muted-foreground block mb-1">Brief</span>
                                                    <p className="line-clamp-2 italic opacity-80">{result.brief}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
