import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Plus, Minus, AlertTriangle, History } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface ProductVariant {
    id: string;
    product_id: string;
    size: string;
    color: string;
    stock: number;
    product: {
        name: string;
        images: string[] | null;
        category: string | null;
    };
}

interface StockHistory {
    id: string;
    change_amount: number;
    previous_stock: number;
    new_stock: number;
    reason: string;
    notes: string | null;
    created_at: string;
    performed_by: string | null;
}

const STOCK_REASONS = [
    { value: 'restock', label: 'Restock' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'lost', label: 'Lost' },
    { value: 'returned', label: 'Customer Return' },
    { value: 'manual_adjustment', label: 'Manual Adjustment' },
];

const Inventory = () => {
    const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState("");
    const [adjustmentReason, setAdjustmentReason] = useState("");
    const [adjustmentNotes, setAdjustmentNotes] = useState("");
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const queryClient = useQueryClient();

    // Fetch all product variants with stock
    const { data: variants, isLoading } = useQuery({
        queryKey: ['inventory', 'variants'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('product_variants')
                .select('*, product:products!inner(name, images, category)')
                .eq('product.is_archived', false)
                .order('stock', { ascending: true });

            if (error) throw error;
            return data as ProductVariant[];
        },
    });

    // Fetch stock history for selected variant
    const { data: stockHistory } = useQuery({
        queryKey: ['stock_history', selectedVariant?.id],
        queryFn: async () => {
            if (!selectedVariant) return [];
            const { data, error } = await supabase
                .from('stock_history')
                .select('*')
                .eq('product_variant_id', selectedVariant.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data as StockHistory[];
        },
        enabled: !!selectedVariant && historyDialogOpen,
    });

    // Adjust stock mutation
    const adjustStock = useMutation({
        mutationFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-stock`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'adjust',
                    variant_id: selectedVariant?.id,
                    amount: Number(adjustmentAmount),
                    reason: adjustmentReason,
                    notes: adjustmentNotes,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to adjust stock');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', 'variants'] });
            queryClient.invalidateQueries({ queryKey: ['stock_history', selectedVariant?.id] });
            toast.success('Stock adjusted successfully');
            setAdjustDialogOpen(false);
            resetAdjustmentForm();
        },
        onError: (error: Error) => {
            toast.error('Failed to adjust stock', { description: error.message });
        },
    });

    const resetAdjustmentForm = () => {
        setAdjustmentAmount("");
        setAdjustmentReason("");
        setAdjustmentNotes("");
        setSelectedVariant(null);
    };

    const handleAdjustStock = (variant: ProductVariant) => {
        setSelectedVariant(variant);
        setAdjustDialogOpen(true);
    };

    const handleViewHistory = (variant: ProductVariant) => {
        setSelectedVariant(variant);
        setHistoryDialogOpen(true);
    };

    const getStockBadgeColor = (stock: number) => {
        if (stock === 0) return "bg-red-500 text-white";
        if (stock < 5) return "bg-red-500/80 text-white";
        if (stock < 10) return "bg-yellow-500 text-black";
        return "bg-green-500 text-white";
    };

    const filteredVariants = variants?.filter(v => {
        // Stock filter
        let stockMatch = true;
        if (stockFilter === 'low') stockMatch = v.stock < 10 && v.stock > 0;
        if (stockFilter === 'out') stockMatch = v.stock === 0;

        // Category filter
        let categoryMatch = true;
        if (categoryFilter !== 'all') {
            categoryMatch = v.product.category === categoryFilter;
        }

        return stockMatch && categoryMatch;
    });

    // Get unique categories
    const categories = Array.from(new Set(variants?.map(v => v.product.category).filter(Boolean))) as string[];

    const lowStockCount = variants?.filter(v => v.stock < 10 && v.stock > 0).length || 0;
    const outOfStockCount = variants?.filter(v => v.stock === 0).length || 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Inventory Management</h1>
                    <p className="text-grey-text mt-1">Manage stock levels and track inventory changes</p>
                </div>
            </div>

            {/* Stock Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:border-jager-red transition-colors" onClick={() => setStockFilter('all')}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-grey-text uppercase font-bold">Total Products</p>
                                <p className="text-3xl font-heading font-bold mt-2">{variants?.length || 0}</p>
                            </div>
                            <Package className="h-12 w-12 text-grey-text" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-yellow-500 transition-colors" onClick={() => setStockFilter('low')}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-grey-text uppercase font-bold">Low Stock</p>
                                <p className="text-3xl font-heading font-bold mt-2 text-yellow-500">{lowStockCount}</p>
                            </div>
                            <AlertTriangle className="h-12 w-12 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-red-500 transition-colors" onClick={() => setStockFilter('out')}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-grey-text uppercase font-bold">Out of Stock</p>
                                <p className="text-3xl font-heading font-bold mt-2 text-red-500">{outOfStockCount}</p>
                            </div>
                            <AlertTriangle className="h-12 w-12 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={categoryFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryFilter('all')}
                    className="font-heading uppercase"
                >
                    All Categories
                </Button>
                {categories.map((category) => (
                    <Button
                        key={category}
                        variant={categoryFilter === category ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCategoryFilter(category)}
                        className="font-heading uppercase"
                    >
                        {category}
                    </Button>
                ))}
            </div>

            {/* Inventory Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Color</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVariants?.map((variant) => (
                                    <TableRow key={variant.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {variant.product.images?.[0] && (
                                                    <img
                                                        src={variant.product.images[0]}
                                                        alt={variant.product.name}
                                                        className="w-12 h-12 object-cover rounded"
                                                    />
                                                )}
                                                <span className="font-medium">{variant.product.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{variant.size}</TableCell>
                                        <TableCell>{variant.color}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge className={getStockBadgeColor(variant.stock)}>
                                                {variant.stock}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAdjustStock(variant)}
                                                >
                                                    Adjust
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewHistory(variant)}
                                                >
                                                    <History className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Adjust Stock Dialog */}
            <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-heading font-bold uppercase">Adjust Stock</DialogTitle>
                        <DialogDescription>
                            {selectedVariant && `${selectedVariant.product.name} - ${selectedVariant.size} / ${selectedVariant.color}`}
                            <br />
                            Current Stock: <strong>{selectedVariant?.stock}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Adjustment Amount</Label>
                            <div className="flex gap-2 mt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAdjustmentAmount(prev => String(Number(prev || 0) - 1))}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                    type="number"
                                    value={adjustmentAmount}
                                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                                    placeholder="Enter amount (+/-)"
                                    className="text-center"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAdjustmentAmount(prev => String(Number(prev || 0) + 1))}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-grey-text mt-1">
                                New stock will be: <strong>{(selectedVariant?.stock || 0) + Number(adjustmentAmount || 0)}</strong>
                            </p>
                        </div>

                        <div>
                            <Label>Reason *</Label>
                            <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STOCK_REASONS.map(reason => (
                                        <SelectItem key={reason.value} value={reason.value}>
                                            {reason.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Notes</Label>
                            <Textarea
                                value={adjustmentNotes}
                                onChange={(e) => setAdjustmentNotes(e.target.value)}
                                placeholder="Optional notes..."
                                rows={3}
                                className="mt-1"
                            />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setAdjustDialogOpen(false);
                                    resetAdjustmentForm();
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => adjustStock.mutate()}
                                disabled={!adjustmentAmount || !adjustmentReason || adjustStock.isPending}
                                className="flex-1"
                            >
                                {adjustStock.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Adjusting...
                                    </>
                                ) : (
                                    'Confirm Adjustment'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Stock History Dialog */}
            <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading font-bold uppercase">Stock History</DialogTitle>
                        <DialogDescription>
                            {selectedVariant && `${selectedVariant.product.name} - ${selectedVariant.size} / ${selectedVariant.color}`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        {stockHistory?.map((entry) => (
                            <Card key={entry.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={entry.change_amount > 0 ? "default" : "destructive"}>
                                                    {entry.change_amount > 0 ? '+' : ''}{entry.change_amount}
                                                </Badge>
                                                <span className="text-sm font-bold uppercase">{entry.reason.replace('_', ' ')}</span>
                                            </div>
                                            <p className="text-sm text-grey-text mt-1">
                                                {entry.previous_stock} → {entry.new_stock}
                                            </p>
                                            {entry.notes && (
                                                <p className="text-sm mt-1">{entry.notes}</p>
                                            )}
                                        </div>
                                        <span className="text-xs text-grey-text">
                                            {new Date(entry.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {stockHistory?.length === 0 && (
                            <p className="text-center text-grey-text py-8">No stock history available</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Inventory;
