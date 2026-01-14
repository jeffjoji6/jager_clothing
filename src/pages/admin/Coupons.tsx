import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Tag, Calendar, Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount: number;
    usage_limit: number | null;
    used_count: number;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
}

const Coupons = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const queryClient = useQueryClient();
    const [newCoupon, setNewCoupon] = useState({
        code: "",
        discount_type: "percentage" as 'percentage' | 'fixed',
        discount_value: "",
        min_order_amount: "0",
        usage_limit: "",
        expires_at: "",
    });

    // Fetch Coupons
    const { data: coupons, isLoading } = useQuery({
        queryKey: ['admin', 'coupons'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as Coupon[];
        }
    });

    // Create Coupon Mutation
    const createCoupon = useMutation({
        mutationFn: async () => {
            // Validate
            if (!newCoupon.code || !newCoupon.discount_value) throw new Error("Code and Value are required");

            const payload = {
                code: newCoupon.code.toUpperCase().trim(),
                discount_type: newCoupon.discount_type,
                discount_value: Number(newCoupon.discount_value),
                min_order_amount: Number(newCoupon.min_order_amount),
                usage_limit: newCoupon.usage_limit ? Number(newCoupon.usage_limit) : null,
                expires_at: newCoupon.expires_at ? new Date(newCoupon.expires_at).toISOString() : null,
            };

            const { error } = await supabase.from('coupons').insert(payload);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Coupon created successfully");
            setDialogOpen(false);
            setNewCoupon({
                code: "",
                discount_type: "percentage",
                discount_value: "",
                min_order_amount: "0",
                usage_limit: "",
                expires_at: ""
            });
            queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
        },
        onError: (error) => toast.error(error.message)
    });

    // Delete Coupon Mutation
    const deleteCoupon = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('coupons').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Coupon deleted");
            queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
        },
        onError: (error) => toast.error(error.message)
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Code copied");
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Coupons</h1>
                    <p className="text-muted-foreground">Manage discount codes and promotions.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> Create Coupon
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Coupon</DialogTitle>
                            <DialogDescription>Add a new discount code for your store.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                            <div>
                                <Label>Coupon Code</Label>
                                <Input
                                    placeholder="e.g. SUMMER25"
                                    className="uppercase font-mono"
                                    value={newCoupon.code}
                                    onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Type</Label>
                                    <Select
                                        value={newCoupon.discount_type}
                                        onValueChange={(v: any) => setNewCoupon({ ...newCoupon, discount_type: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Value</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={newCoupon.discount_value}
                                        onChange={e => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Minimum Order Amount (₹)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={newCoupon.min_order_amount}
                                    onChange={e => setNewCoupon({ ...newCoupon, min_order_amount: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground mt-1">Leave 0 for no minimum.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Usage Limit</Label>
                                    <Input
                                        type="number"
                                        placeholder="∞"
                                        value={newCoupon.usage_limit}
                                        onChange={e => setNewCoupon({ ...newCoupon, usage_limit: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Total global uses.</p>
                                </div>
                                <div>
                                    <Label>Expiry Date</Label>
                                    <Input
                                        type="datetime-local"
                                        value={newCoupon.expires_at}
                                        onChange={e => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button className="w-full" onClick={() => createCoupon.mutate()} disabled={createCoupon.isPending}>
                                {createCoupon.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Create Coupon"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Coupons</CardTitle>
                    <CardDescription>List of all discount codes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Min. Order</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coupons?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No coupons found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                coupons?.map(coupon => (
                                    <TableRow key={coupon.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-4 w-4 text-primary" />
                                                <span className="font-mono font-bold">{coupon.code}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(coupon.code)}>
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-green-600">
                                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`} OFF
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {coupon.used_count}
                                            {coupon.usage_limit ? <span className="text-muted-foreground"> / {coupon.usage_limit}</span> : ''}
                                        </TableCell>
                                        <TableCell>
                                            {coupon.min_order_amount > 0 ? `₹${coupon.min_order_amount}` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {coupon.expires_at ? (
                                                <div className={`flex items-center gap-1 ${new Date(coupon.expires_at) < new Date() ? 'text-red-500' : ''}`}>
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(coupon.expires_at), 'MMM d, yyyy')}
                                                </div>
                                            ) : 'Never'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => {
                                                    if (confirm("Delete this coupon?")) deleteCoupon.mutate(coupon.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default Coupons;
