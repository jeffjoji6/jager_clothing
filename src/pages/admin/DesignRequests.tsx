import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Palette, User, Phone, Mail, FileText, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface DesignRequest {
    id: string;
    request_ref?: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    whatsapp_number: string | null;
    brief: string;
    quantity: number | null;
    budget_range: string | null;
    image_url?: string | null;
    status: string;
    created_at: string;
}

const statusColors: Record<string, string> = {
    new: "bg-blue-500",
    contacted: "bg-yellow-500",
    in_progress: "bg-orange-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
};

const DesignRequests = () => {
    const [selectedRequest, setSelectedRequest] = useState<DesignRequest | null>(null);
    const queryClient = useQueryClient();

    // Fetch requests
    const { data: requests, isLoading } = useQuery({
        queryKey: ['admin', 'design-requests'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('custom_design_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as DesignRequest[];
        },
    });

    // Realtime subscription
    useEffect(() => {
        const channel = supabase
            .channel('custom_design_requests_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'custom_design_requests',
                },
                (payload) => {
                    console.log('Realtime update:', payload);
                    queryClient.invalidateQueries({ queryKey: ['admin', 'design-requests'] });
                    if (payload.eventType === 'INSERT') {
                        toast.info("New design request received!");
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    // Update status mutation
    const updateStatus = useMutation({
        mutationFn: async ({ requestId, newStatus }: { requestId: string; newStatus: string }) => {
            const { error } = await supabase
                .from('custom_design_requests')
                .update({ status: newStatus })
                .eq('id', requestId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'design-requests'] });
            toast.success("Status updated");
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Jager Custom Design</h1>
                    <p className="text-grey-text mt-1">Manage incoming custom design leads</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                <tr>
                                    <th className="h-12 px-4 align-middle">Date</th>
                                    <th className="h-12 px-4 align-middle">Ref ID</th>
                                    <th className="h-12 px-4 align-middle">Customer</th>
                                    <th className="h-12 px-4 align-middle">Brief</th>
                                    <th className="h-12 px-4 align-middle">Status</th>
                                    <th className="h-12 px-4 align-middle text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </td>
                                    </tr>
                                ) : requests && requests.length > 0 ? (
                                    requests.map((request) => (
                                        <tr key={request.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium">{format(new Date(request.created_at), 'MMM dd')}</div>
                                                <div className="text-xs text-grey-text">{format(new Date(request.created_at), 'yyyy')}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-sm font-mono tracking-wider bg-muted px-2 py-1 rounded w-fit">
                                                    {request.request_ref || `#${request.id.slice(0, 8)}`}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold">{request.name}</div>
                                                <div className="text-xs text-grey-text flex items-center gap-1">
                                                    {request.phone || request.whatsapp_number}
                                                </div>
                                            </td>
                                            <td className="p-4 max-w-xs">
                                                <div className="line-clamp-1 text-foreground/80">{request.brief}</div>
                                                {(request.image_url) && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="relative w-8 h-8 rounded overflow-hidden border border-border bg-muted">
                                                            <img
                                                                src={request.image_url.split(',')[0]}
                                                                alt="Thumbnail"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {request.image_url.split(',').length > 1
                                                                ? `+${request.image_url.split(',').length - 1} more`
                                                                : 'Attached'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <Badge className={`${statusColors[request.status] || 'bg-gray-500'} text-white uppercase text-[10px]`}>
                                                    {request.status.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedRequest(request)}
                                                >
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-grey-text">
                                            No requests found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Request Detail Dialog */}
            {selectedRequest && (
                <Dialog open={!!selectedRequest} onOpenChange={(open) => {
                    if (!open) setSelectedRequest(null);
                }}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden gap-0">
                        <div className="grid md:grid-cols-5 h-[600px]">
                            {/* Left Side - Image Gallery & Status */}
                            <div className="md:col-span-2 bg-muted/30 border-r border-border p-6 flex flex-col overflow-y-auto">
                                <h3 className="font-heading font-bold uppercase text-lg mb-4">References</h3>

                                <div className="space-y-4">
                                    {selectedRequest.image_url ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {selectedRequest.image_url.split(',').map((url, index) => (
                                                <a
                                                    key={index}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`relative aspect-square rounded-lg overflow-hidden border border-border bg-white group ${selectedRequest.image_url && selectedRequest.image_url.split(',').length === 1 ? 'col-span-2 aspect-video' : ''}`}
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Ref ${index + 1}`}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <span className="text-white text-[10px] uppercase font-bold border border-white/50 px-2 py-1 rounded-full">View</span>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="aspect-video bg-muted border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground p-6">
                                            <Palette className="w-8 h-8 mb-2 opacity-50" />
                                            <p className="text-xs">No reference images</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 space-y-4">
                                    <div>
                                        <Label className="text-xs text-grey-text uppercase">Current Status</Label>
                                        <div className="mt-1">
                                            <Select
                                                value={selectedRequest.status}
                                                onValueChange={(value) => updateStatus.mutate({ requestId: selectedRequest.id, newStatus: value })}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="new">New</SelectItem>
                                                    <SelectItem value="contacted">Contacted</SelectItem>
                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side - Details */}
                            <div className="md:col-span-3 p-6 flex flex-col h-full overflow-y-auto">
                                <DialogHeader className="mb-6">
                                    <DialogTitle className="font-heading font-bold uppercase text-2xl">
                                        Request {selectedRequest.request_ref ? `${selectedRequest.request_ref}` : `#${selectedRequest.id.slice(0, 8)}`}
                                    </DialogTitle>
                                    <p className="text-sm text-grey-text">
                                        Received on {format(new Date(selectedRequest.created_at), 'PPP')} at {format(new Date(selectedRequest.created_at), 'p')}
                                    </p>
                                </DialogHeader>

                                <div className="space-y-6 flex-1">
                                    {/* Customer Card */}
                                    <div className="bg-muted/10 p-4 rounded-lg border border-border">
                                        <Label className="text-xs text-grey-text uppercase mb-3 flex items-center gap-2 font-bold">
                                            <User className="w-3 h-3" /> Customer Details
                                        </Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="font-bold text-lg">{selectedRequest.name}</p>
                                                <p className="text-sm text-grey-text">{selectedRequest.email || "No email"}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-mono text-sm">{selectedRequest.phone || selectedRequest.whatsapp_number}</p>
                                                <a
                                                    href={`https://wa.me/${selectedRequest.whatsapp_number || selectedRequest.phone}?text=Hi ${selectedRequest.name}, regarding your custom design request...`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-bold mt-1 uppercase tracking-wide"
                                                >
                                                    <MessageCircle className="w-3 h-3" /> Chat on WhatsApp
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Specs Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg border border-border bg-background">
                                            <Label className="text-xs text-grey-text uppercase mb-1">Quantity</Label>
                                            <p className="text-xl font-bold">{selectedRequest.quantity || 'N/A'}</p>
                                            <p className="text-xs text-grey-text">Units</p>
                                        </div>
                                        <div className="p-4 rounded-lg border border-border bg-background">
                                            <Label className="text-xs text-grey-text uppercase mb-1">Budget Range</Label>
                                            <p className="text-xl font-bold">{selectedRequest.budget_range || 'N/A'}</p>
                                            <p className="text-xs text-grey-text">Estimated</p>
                                        </div>
                                    </div>

                                    {/* Brief */}
                                    <div>
                                        <Label className="text-xs text-grey-text uppercase mb-2 block font-bold">Project Brief</Label>
                                        <div className="bg-muted/30 p-4 rounded-lg border border-border min-h-[150px] text-sm leading-relaxed whitespace-pre-wrap">
                                            {selectedRequest.brief}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-border flex justify-end">
                                    <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                                        Close Details
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default DesignRequests;
