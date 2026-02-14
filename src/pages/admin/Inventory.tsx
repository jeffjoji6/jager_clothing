import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Package, Upload, X, Link as LinkIcon, History, AlertTriangle, Minus, ChevronDown, ChevronUp, RefreshCw, Wand2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadImage, uploadToSupabase, deleteImage } from "@/lib/imageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ImageEditorDialog } from "@/components/ImageEditorDialog";

// --- Types ---
interface Product {
    id: string;
    name: string;
    description: string | null;
    base_price: number;
    discounted_price: number | null;
    category: string | null;
    images: string[] | null;
    featured: boolean;
    is_new: boolean;
    is_hidden: boolean;
    amazon_url: string | null;
    amazon_asin: string | null;
    sku: string | null;
    brand: string | null;
    material: string | null;
    care_instructions: string | null;
}

interface ProductVariant {
    id: string;
    product_id: string;
    size: string;
    color: string;
    stock: number;
    price_modifier: number;
    actual_price: number | null;
    discounted_price: number | null;
    barcode: string | null;
    is_archived?: boolean;
    image_url?: string;
    images?: string[];
    color_code?: string;
    is_default?: boolean;
}

interface ProductWithStock extends Product {
    product_variants: { stock: number; is_archived?: boolean }[];
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

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Grey', 'Navy', 'Olive', 'Brown', 'Beige', 'Cream', 'Charcoal'];
const CATEGORIES = ['TEES', 'HOODIES', 'BOTTOMS', 'Custom'];



// --- Optimized Sub-components ---
// Memoized Row to prevent re-rendering entire list when one changes
const VariantRow = React.memo(({ v, idx, onEdit, onRemove, onAdjust, onHistory }: any) => {
    return (
        <tr className="border-b">
            <TableCell className="font-bold">{v.size}</TableCell>
            <TableCell>{v.color}</TableCell>
            <TableCell className="text-right text-muted-foreground">{v.actual_price ? `₹${v.actual_price}` : 'Inherited'}</TableCell>
            <TableCell className="text-right text-muted-foreground">{v.discounted_price ? `₹${v.discounted_price}` : '-'}</TableCell>
            <TableCell>
                {v.image_url ? (
                    <img src={v.image_url} alt="Variant" loading="lazy" className="w-8 h-8 object-cover rounded border" />
                ) : <span className="text-muted-foreground text-xs">-</span>}
            </TableCell>
            <TableCell className="text-center">
                <Input
                    type="number"
                    className="w-24 text-right inline-block h-8"
                    defaultValue={v.actual_price || ''}
                    onBlur={e => onAdjust(v.id, 'actual_price', e.target.value)}
                />
            </TableCell>
            <TableCell className="text-right">
                <Input
                    type="number"
                    className="w-24 text-right inline-block h-8"
                    defaultValue={v.discounted_price || ''}
                    onBlur={e => onAdjust(v.id, 'discounted_price', e.target.value)}
                />
            </TableCell>
            <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                    <span className={`font-mono font-bold ${v.stock < 5 ? 'text-red-500' : 'text-green-600'}`}>{v.stock}</span>
                    {!v.id.startsWith('temp-') && (
                        <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => onAdjust(v, 'stock_dialog')}>Adjust</Button>
                    )}
                </div>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                    {!v.id.startsWith('temp-') && (
                        <Button variant="ghost" size="sm" onClick={() => onHistory(v)}>
                            <History className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => { if (confirm("Remove variant?")) onRemove(v.id); }}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </tr>
    );
}, (prev, next) => {
    // Deep comparison on variant data that affects rendering
    const pv = prev.v;
    const nv = next.v;
    return (
        pv.id === nv.id &&
        pv.size === nv.size &&
        pv.color === nv.color &&
        pv.actual_price === nv.actual_price &&
        pv.discounted_price === nv.discounted_price &&
        pv.stock === nv.stock &&
        pv.image_url === nv.image_url &&
        prev.onAdjust === next.onAdjust &&
        prev.onRemove === next.onRemove &&
        prev.onHistory === next.onHistory
    );
});

// Memoized List Wrapper with Pagination
const VariantList = React.memo(({ variants, onEdit, onRemove, onUpdate, onHistory, onAdjustStock }: any) => {
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Calculate pagination
    const totalPages = Math.ceil(variants.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedVariants = useMemo(() => {
        return variants.slice(startIdx, startIdx + itemsPerPage);
    }, [variants, startIdx, itemsPerPage]);

    // Reset to page 1 when variants change significantly
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [variants.length, totalPages, currentPage]);

    // Create a stable callback for the VariantRow onAdjust prop
    const handleAdjust = useCallback((variantOrId: any, field: string, val?: any) => {
        if (field === 'stock_dialog') {
            onAdjustStock(variantOrId);
        } else {
            onUpdate(variantOrId, field, val);
        }
    }, [onAdjustStock, onUpdate]);

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Size</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead>Image (Opt)</TableHead>
                        <TableHead className="text-center">Stock Level</TableHead>
                        <TableHead className="text-right">Discount (Edit)</TableHead>
                        <TableHead className="text-center shrink-0">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedVariants.map((v: any, idx: number) => (
                        <VariantRow
                            key={v.id || (startIdx + idx)}
                            v={v}
                            idx={startIdx + idx}
                            onEdit={onEdit}
                            onRemove={onRemove}
                            onAdjust={handleAdjust}
                            onHistory={onHistory}
                        />
                    ))}
                    {variants.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No variants found.</TableCell></TableRow>}
                </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30">
                    <span className="text-xs text-muted-foreground">
                        Showing {startIdx + 1}-{Math.min(startIdx + itemsPerPage, variants.length)} of {variants.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Prev
                        </Button>
                        <span className="text-xs text-muted-foreground">
                            {currentPage} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
});


// Helper function (module scope so ProductRow can use it)
const getTotalStock = (product: ProductWithStock) => {
    return product.product_variants?.reduce((sum, variant) => {
        if (variant.is_archived) return sum;
        return sum + Number(variant.stock || 0);
    }, 0) || 0;
};

// Memoized ProductRow to prevent re-renders
const ProductRow = React.memo(({ product, onManage, onDelete, onToggleVisibility }: { product: ProductWithStock, onManage: (p: ProductWithStock) => void, onDelete: (id: string) => void, onToggleVisibility: (id: string, isHidden: boolean) => void }) => {
    const totalStock = getTotalStock(product);

    return (
        <TableRow>
            <TableCell>
                {product.images?.[0] && (
                    <img src={product.images[0]} alt={product.name} loading="lazy" className="w-12 h-12 object-cover rounded bg-muted" />
                )}
            </TableCell>
            <TableCell>
                <div className="font-medium">{product.name}</div>
                <div className="text-xs text-muted-foreground">{product.sku}</div>
            </TableCell>
            <TableCell>{product.category}</TableCell>
            <TableCell>
                {product.discounted_price ? (
                    <div className="flex flex-col">
                        <span className="text-red-500 font-bold">₹{product.discounted_price}</span>
                        <span className="line-through text-xs text-muted-foreground">₹{product.base_price}</span>
                    </div>
                ) : `₹${product.base_price}`}
            </TableCell>
            <TableCell>
                <Badge variant="outline" className={totalStock === 0 ? "text-red-500 border-red-500" : totalStock < 10 ? "text-yellow-500 border-yellow-500" : "text-green-500 border-green-500"}>
                    {totalStock}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleVisibility(product.id, !product.is_hidden)}
                        title={product.is_hidden ? "Show product" : "Hide product"}
                    >
                        {product.is_hidden ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onManage(product)}>
                        <Edit className="h-4 w-4 mr-1" /> Manage Product
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => onDelete(product.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow >
    );
}, (prev, next) => prev.product === next.product);


const Inventory = () => {
    // --- State ---
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [activeTab, setActiveTab] = useState("basic");
    const [uploadingImages, setUploadingImages] = useState(false);

    // Manage Variants / Stock Dialog
    const [manageVariantsOpen, setManageVariantsOpen] = useState(false);
    const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);

    // Image Editor State
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorFile, setEditorFile] = useState<File | null>(null);
    const [editorContext, setEditorContext] = useState<{ type: 'product' | 'variant', isPrimary?: boolean } | null>(null);

    // Adjust Stock Dialog
    const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
    const [selectedVariantForAdjust, setSelectedVariantForAdjust] = useState<ProductVariant | null>(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState("");
    const [adjustmentReason, setAdjustmentReason] = useState("");
    const [adjustmentNotes, setAdjustmentNotes] = useState("");

    // History Dialog
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [selectedVariantForHistory, setSelectedVariantForHistory] = useState<ProductVariant | null>(null);

    // Forms
    const [productForm, setProductForm] = useState({
        name: "",
        description: "",
        base_price: "",
        discounted_price: "",
        category: "",
        images: [] as string[],
        featured: false,
        is_new: false,
        amazon_url: "",
        amazon_asin: "",
        sku: "",
        brand: "",
        material: "",
        care_instructions: "",
    });
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [variantsToDelete, setVariantsToDelete] = useState<string[]>([]);
    const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
    const [newVariant, setNewVariant] = useState({
        size: "",
        color: "",
        stock: "",
        actual_price: "",
        discounted_price: "",
        price_modifier: "0",
        images: [] as string[], // Changed from image_url to images array
        color_code: "",
        is_default: false,
    });

    // Helper to ensure only one default
    const handleSetDefaultVariant = (variantId: string) => {
        setVariants(prev => prev.map(v => ({
            ...v,
            is_default: v.id === variantId
        })));
    };



    // Handlers for Row


    const queryClient = useQueryClient();

    // --- Queries ---
    const { data: products, isLoading } = useQuery({
        queryKey: ['admin', 'products'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*, product_variants(stock, is_archived)')
                .eq('is_archived', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as ProductWithStock[];
        },
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filtered & Paginated Products
    const filteredProducts = useMemo(() => {
        if (!products) return [];
        let result = products;
        return result;
    }, [products]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(start, start + itemsPerPage);
    }, [filteredProducts, currentPage]);

    // Fetch variants for selected product (Edit or Manage)
    const { data: productVariants } = useQuery({
        queryKey: ['admin', 'product', editingProduct?.id || selectedProductForVariants?.id, 'variants'],
        queryFn: async () => {
            const id = editingProduct?.id || selectedProductForVariants?.id;
            if (!id) return [];
            const { data, error } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', id)
                .eq('is_archived', false) // Only active
                .order('size', { ascending: true });

            if (error) throw error;
            return data as ProductVariant[];
        },
        enabled: !!editingProduct || !!selectedProductForVariants,
    });

    // Fetch stock history
    const { data: stockHistory } = useQuery({
        queryKey: ['stock_history', selectedVariantForHistory?.id],
        queryFn: async () => {
            if (!selectedVariantForHistory) return [];
            const { data, error } = await supabase
                .from('stock_history')
                .select('*')
                .eq('product_variant_id', selectedVariantForHistory.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data as StockHistory[];
        },
        enabled: !!selectedVariantForHistory && historyDialogOpen,
    });


    // --- Effects ---
    useEffect(() => {
        if ((editingProduct || selectedProductForVariants) && productVariants) {
            const product = editingProduct || selectedProductForVariants;
            const basePrice = Number(product?.base_price || 0);

            // Use functional update to prevent unnecessary re-renders if data hasn't changed
            setVariants(prev => {
                const mappedVariants = productVariants.map(v => ({
                    ...v,
                    actual_price: v.actual_price || (v.price_modifier ? basePrice + Number(v.price_modifier) : basePrice),
                    stock: Number(v.stock || 0)
                }));
                // Simple deep equality check or JSON stringify check to avoid loop if coming from same data
                if (JSON.stringify(prev) === JSON.stringify(mappedVariants)) return prev;
                return mappedVariants;
            });
        }
    }, [productVariants, editingProduct, selectedProductForVariants]);



    // --- Mutation Logic (Product CRUD) ---
    // Handle filtered image selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'variant', isPrimary: boolean = false) => {
        if (e.target.files && e.target.files.length > 0) {
            setEditorFile(e.target.files[0]);
            setEditorContext({ type, isPrimary });
            setEditorOpen(true);
            e.target.value = ''; // Reset
        }
    };

    const handleEditorSave = async (processedBlob: Blob) => {
        if (!editorContext) return;

        // Convert Blob to File (needed for uploadImage util if it expects File, or update util)
        // uploadImage expects File.
        const file = new File([processedBlob], "processed_image.png", { type: "image/png" });

        setUploadingImages(true);
        try {
            // Use Cloudinary for product images (faster CDN)
            const url = await uploadImage(file);

            if (url) {
                if (editorContext.type === 'product') {
                    if (editorContext.isPrimary) {
                        // If primary, replace index 0 or init array
                        const newImages = [...productForm.images];
                        if (newImages.length === 0) newImages.push(url);
                        else newImages[0] = url;
                        setProductForm(prev => ({ ...prev, images: newImages }));
                    } else {
                        setProductForm(prev => ({ ...prev, images: [...prev.images, url] }));
                    }
                } else {
                    setNewVariant(prev => {
                        const updated = { ...prev, images: [...prev.images, url] };
                        return updated;
                    });
                }
                toast.success("Image uploaded successfully!");
            } else {
                toast.error("Upload failed (no URL returned)");
            }
        } catch (error: any) {
            toast.error(`Upload failed: ${error.message}`);
        } finally {
            setUploadingImages(false);
            setEditorContext(null);
            setEditorFile(null);
        }
    };


    // Direct upload WITHOUT image editor (for debugging artifacts)
    const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'variant') => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        e.target.value = '';

        setUploadingImages(true);
        try {
            const url = await uploadImage(file);
            if (url) {
                if (type === 'product') {
                    setProductForm(prev => ({ ...prev, images: [...prev.images, url] }));
                } else {
                    setNewVariant(prev => ({ ...prev, images: [...prev.images, url] }));
                }
                toast.success("Direct upload complete (no editor)!");
            } else {
                toast.error("Upload failed");
            }
        } catch (error: any) {
            toast.error(`Upload failed: ${error.message}`);
        } finally {
            setUploadingImages(false);
        }
    };

    const handleRemoveImage = async (index: number, imageUrl: string) => {
        try {
            await deleteImage(imageUrl);
            const newImages = productForm.images.filter((_, i) => i !== index);
            setProductForm({ ...productForm, images: newImages });
            toast.success("Image removed");
        } catch (error: any) {
            const newImages = productForm.images.filter((_, i) => i !== index);
            setProductForm({ ...productForm, images: newImages });
        }
    };

    const setAsPrimary = (index: number) => {
        if (index === 0) return;
        const newImages = [...productForm.images];
        const [imageToMove] = newImages.splice(index, 1);
        newImages.unshift(imageToMove);
        setProductForm({ ...productForm, images: newImages });
    };

    // Auto-fill images when selecting a color that already exists in variants
    // Auto-fill images when selecting a color that already exists in variants
    // Optimization: Only run when 'color' changes, not on every newVariant change
    useEffect(() => {
        if (newVariant.color && !editingVariantId && newVariant.images.length === 0) {
            const existingVariant = variants.find(v => v.color === newVariant.color && v.images && v.images.length > 0);
            if (existingVariant && existingVariant.images) {
                setNewVariant(prev => ({ ...prev, images: existingVariant.images || [] }));
                toast.info(`Auto-filled images from existing ${newVariant.color} variant`);
            }
        }
    }, [newVariant.color]); // Removed unnecessary dependencies: editingVariantId, variants (variants is stable enough or rarely changes during single input session)

    // Variant Logic (Frontend)
    const handleAddVariant = () => {
        if (!newVariant.size || !newVariant.color) {
            toast.error("Please select size and color");
            return;
        }

        // Check for duplicates
        if (variants.some(v => v.size === newVariant.size && v.color === newVariant.color && v.id !== editingVariantId)) {
            toast.error(`Variant ${newVariant.size} - ${newVariant.color} already exists!`);
            return;
        }

        const variantData: ProductVariant = {
            id: editingVariantId || `temp-${Date.now()}`,
            product_id: editingProduct?.id || selectedProductForVariants?.id || '',
            size: newVariant.size,
            color: newVariant.color,
            stock: Number(newVariant.stock) || 0,
            price_modifier: Number(newVariant.price_modifier) || 0,
            actual_price: newVariant.actual_price ? Number(newVariant.actual_price) : Number(productForm.base_price),
            discounted_price: newVariant.discounted_price ? Number(newVariant.discounted_price) : (productForm.discounted_price ? Number(productForm.discounted_price) : null),
            images: newVariant.images.length > 0 ? newVariant.images : undefined,
            color_code: newVariant.color_code || undefined,
            barcode: null,
            // Preserve is_archived if editing existing variant
            is_archived: editingVariantId ? variants.find(v => v.id === editingVariantId)?.is_archived : undefined,
            is_default: newVariant.is_default || (variants.length === 0)
        };

        if (editingVariantId) {
            setVariants(prev => {
                let next = prev.map(v => v.id === editingVariantId ? variantData : v);
                if (variantData.is_default) {
                    next = next.map(v => ({ ...v, is_default: v.id === variantData.id }));
                }
                return next;
            });
            setEditingVariantId(null);
            toast.success("Variant updated");
        } else {
            setVariants(prev => {
                let next = [...prev, variantData];
                if (variantData.is_default) {
                    next = next.map(v => ({ ...v, is_default: v.id === variantData.id }));
                }
                return next;
            });
            toast.success("Variant added");
        }

        setNewVariant({ size: "", color: "", stock: "", actual_price: "", discounted_price: "", price_modifier: "0", images: [], color_code: "", is_default: false });
    };

    const handleEditVariantClick = (variant: ProductVariant) => {
        setEditingVariantId(variant.id);
        setNewVariant({
            size: variant.size,
            color: variant.color,
            stock: variant.stock.toString(),
            actual_price: variant.actual_price?.toString() || "",
            discounted_price: variant.discounted_price?.toString() || "",
            price_modifier: variant.price_modifier.toString(),
            images: (variant.images && variant.images.length > 0) ? variant.images : (variant.image_url ? [variant.image_url] : []),
            color_code: variant.color_code || "",
            is_default: variant.is_default || false
        });
    };

    const handleRemoveVariant = useCallback((variantId: string) => {
        if (!variantId.startsWith('temp-')) {
            setVariantsToDelete(prev => [...prev, variantId]);
        }
        setVariants(prev => prev.filter(v => v.id !== variantId));
    }, []);

    const handleUpdateVariant = useCallback((variantId: string, field: string, value: any) => {
        setVariants(prev => prev.map(v => v.id === variantId ? { ...v, [field]: value } : v));
    }, []);


    // Create/Update Product
    const createProduct = useMutation({
        mutationFn: async () => {
            // Create product
            const { data: product, error: productError } = await supabase
                .from('products')
                .insert({
                    name: productForm.name,
                    description: productForm.description || null,
                    base_price: variants.length > 0 ? Number(variants[0].actual_price || 0) : Number(productForm.base_price || 0),
                    discounted_price: variants.length > 0 ? (variants[0].discounted_price ? Number(variants[0].discounted_price) : null) : (productForm.discounted_price ? Number(productForm.discounted_price) : null),
                    category: productForm.category || null,
                    images: productForm.images.length > 0 ? productForm.images : null,
                    featured: productForm.featured,
                    is_new: productForm.is_new,
                    amazon_url: productForm.amazon_url || null,
                    amazon_asin: productForm.amazon_asin || null,
                    sku: productForm.sku || null,
                    material: productForm.material || null,
                    care_instructions: productForm.care_instructions || null,
                })
                .select()
                .single();

            if (productError) throw productError;

            // Create variants
            if (variants.length > 0 && product) {
                const variantData = variants.map(v => ({
                    product_id: product.id,
                    size: v.size,
                    color: v.color,
                    stock: v.stock,
                    price_modifier: v.price_modifier,
                    actual_price: v.actual_price,
                    discounted_price: v.discounted_price,
                    images: v.images || [],
                    color_code: v.color_code,
                }));

                const { error: variantsError } = await supabase.from('product_variants').insert(variantData);
                if (variantsError) throw variantsError;
            }
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            toast.success("Product created successfully");
            setDialogOpen(false);
            resetForm();
        },
        onError: (error) => toast.error(`Failed to create product: ${error.message}`)
    });

    const updateProduct = useMutation({
        mutationFn: async () => {
            if (!editingProduct && !selectedProductForVariants) return;
            const productId = editingProduct?.id || selectedProductForVariants?.id;
            if (!productId) return;

            // Update Metadata only if editing via Edit Dialog
            if (editingProduct) {
                const { error: productError } = await supabase
                    .from('products')
                    .update({
                        name: productForm.name,
                        description: productForm.description || null,
                        base_price: variants.length > 0 ? Number(variants[0].actual_price || 0) : 0,
                        discounted_price: variants.length > 0 ? (variants[0].discounted_price ? Number(variants[0].discounted_price) : null) : null,
                        category: productForm.category || null,
                        images: productForm.images.length > 0 ? productForm.images : null,
                        featured: productForm.featured,
                        is_new: productForm.is_new,
                        amazon_url: productForm.amazon_url || null,
                        amazon_asin: productForm.amazon_asin || null,
                        sku: productForm.sku || null,
                        material: productForm.material || null,
                        care_instructions: productForm.care_instructions || null,
                    })
                    .eq('id', productId);

                if (productError) throw productError;
            }

            // Sync Variants (Upsert/Delete)
            const productBasePrice = Number(productForm.base_price || 0);

            const variantsToUpsert = variants.map(v => {
                // Calculate modifier: (Desired Price - Base Price)
                // If actual_price is set, use it. If not, modifier is 0 (or previous modifier).
                // Safest: If user input actual_price, recalculate modifier.

                let modifier = Number(v.price_modifier || 0);
                if (v.actual_price) {
                    modifier = Number(v.actual_price) - productBasePrice;
                }

                const baseVariant = {
                    product_id: productId,
                    size: v.size,
                    color: v.color,
                    stock: Number(v.stock),
                    price_modifier: modifier,
                    // We still send actual_price/discounted_price if DB has them, but modifier is key for Storefront
                    actual_price: v.actual_price ? Number(v.actual_price) : null,
                    discounted_price: v.discounted_price ? Number(v.discounted_price) : null,
                    image_url: (v.images && v.images.length > 0) ? v.images[0] : (v.image_url || null),
                    images: v.images,
                    color_code: v.color_code,
                    is_archived: false,
                    is_default: v.is_default || false
                };

                // Only include ID for existing variants (not temp ones)
                // This allows upsert to work correctly with onConflict
                if (!v.id.startsWith('temp-')) {
                    return { ...baseVariant, id: v.id };
                }

                return baseVariant;
            });

            // Delete removed variants (Soft Delete)
            if (variantsToDelete.length > 0) {
                // We use soft delete because order_items may reference these variants
                const { error: deleteError } = await supabase
                    .from('product_variants')
                    .update({ is_archived: true })
                    .in('id', variantsToDelete);

                if (deleteError) throw deleteError;
            }
            // Split variants into new (temp IDs) and existing (real IDs)
            const newVariants = variantsToUpsert.filter(v => !('id' in v));
            const existingVariants = variantsToUpsert.filter(v => 'id' in v);

            // Insert or Upsert new variants (handles re-adding archived ones)
            if (newVariants.length > 0) {
                // We use upsert here because if we re-add a variant that was soft-deleted,
                // it still exists in the DB (is_archived=true).
                // Upsert with onConflict matches it and updates is_archived=false.
                const { error: insertError } = await supabase
                    .from('product_variants')
                    .upsert(newVariants, {
                        onConflict: 'product_id,size,color',
                        ignoreDuplicates: false
                    });

                if (insertError) throw insertError;
            }

            // Update existing variants (including un-archiving)
            if (existingVariants.length > 0) {
                for (const variant of existingVariants) {
                    const { error: updateError } = await supabase
                        .from('product_variants')
                        .update(variant)
                        .eq('id', variant.id);

                    if (updateError) throw updateError;
                }
            }

            // Archive removed
            // (Logic simplified: we rely on upsert updating existing. For deletions, we need to track IDs)
            // For now, let's just handle addition/updates. Deletions in "Manage" are instant?
            // Let's implement handleRemoveVariant to actually mark as archived if we save?
            // For simplicity, handleRemoveVariant just removes from UI list. 
            // Ideally we should track deletions.
        },
        onSuccess: async () => {
            const id = editingProduct?.id || selectedProductForVariants?.id;
            await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            await queryClient.invalidateQueries({ queryKey: ['admin', 'product', id, 'variants'] });
            toast.success("Changes saved successfully");
            setDialogOpen(false);
            setManageVariantsOpen(false); // Close manage list if open
            if (editingProduct) resetForm();
            setEditingProduct(null);
            setSelectedProductForVariants(null);
            setVariantsToDelete([]); // Clear deletion list
        },
        onError: (error) => toast.error(`Failed to update: ${error.message}`)
    });

    const deleteProduct = useMutation({
        mutationFn: async (productId: string) => {
            const { error } = await supabase.from('products').update({ is_archived: true }).eq('id', productId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            toast.success("Product archived");
        },
        onError: (error) => toast.error(error.message)
    });

    // --- Mutation Logic (Stock Adjustment) ---
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
                    variant_id: selectedVariantForAdjust?.id,
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
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'product', selectedProductForVariants?.id, 'variants'] }); // Refresh variants list
            queryClient.invalidateQueries({ queryKey: ['stock_history', selectedVariantForAdjust?.id] });
            toast.success('Stock adjusted successfully');
            setAdjustDialogOpen(false);
            setAdjustmentAmount("");
            setAdjustmentReason("");
            setAdjustmentNotes("");
        },
        onError: (error) => toast.error(error.message)
    });


    // Handlers for Row
    const handleManageProduct = useCallback((product: ProductWithStock) => {
        handleOpenEdit(product);
        setManageVariantsOpen(false);
    }, []);

    const handleDeleteProduct = useCallback((id: string) => {
        if (confirm("Delete product?")) {
            deleteProduct.mutate(id);
        }
    }, [deleteProduct]);

    // Toggle product visibility
    const toggleVisibility = useMutation({
        mutationFn: async ({ id, isHidden }: { id: string; isHidden: boolean }) => {
            const { error } = await supabase
                .from('products')
                .update({ is_hidden: isHidden })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
            toast.success("Product visibility updated");
        },
        onError: (error) => toast.error(error.message)
    });

    const handleToggleVisibility = useCallback((id: string, isHidden: boolean) => {
        toggleVisibility.mutate({ id, isHidden });
    }, [toggleVisibility]);



    // --- UI Actions ---
    const resetForm = () => {
        setProductForm({
            name: "", description: "", base_price: "", discounted_price: "", category: "",
            images: [], featured: false, is_new: false, amazon_url: "", amazon_asin: "",
            sku: "", brand: "", material: "", care_instructions: "",
        });
        setVariants([]);
        setVariantsToDelete([]);
        setNewVariant({ size: "", color: "", stock: "", actual_price: "", discounted_price: "", price_modifier: "0", images: [], color_code: "", is_default: false });
        setActiveTab("basic");
    };

    const handleOpenEdit = (product: Product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name || "",
            description: product.description || "",
            base_price: product.base_price?.toString() || "0",
            discounted_price: product.discounted_price?.toString() || "",
            category: product.category || "",
            images: product.images || [],
            featured: !!product.featured,
            is_new: !!product.is_new,
            amazon_url: product.amazon_url || "",
            amazon_asin: product.amazon_asin || "",
            sku: product.sku || "",
            brand: product.brand || "",
            material: product.material || "",
            care_instructions: product.care_instructions || "",
        });
        setDialogOpen(true);
    };

    const handleOpenManageVariants = (product: Product) => {
        setSelectedProductForVariants(product);
        // Reset local query-bound variants? They update via effect.
        setManageVariantsOpen(true);
    };

    const handleOpenAdjustStock = (variant: ProductVariant) => {
        setSelectedVariantForAdjust(variant);
        setAdjustDialogOpen(true);
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Inventory</h1>
                    <p className="text-grey-text mt-1">Manage products, variants, and stock levels</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => { resetForm(); setEditingProduct(null); setDialogOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                    </Button>
                </div>
            </div>

            {/* Products Table (Unified View) */}
            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedProducts.map((product) => (
                                    <ProductRow
                                        key={product.id}
                                        product={product}
                                        onManage={handleManageProduct}
                                        onDelete={handleDeleteProduct}
                                        onToggleVisibility={handleToggleVisibility}
                                    />
                                ))}
                            </TableBody>
                        </Table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-end space-x-2 py-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Dialog: Add/Edit Product (Metadata only mostly, but can add variants initially) */}
            <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                    // Reset form when dialog closes
                    resetForm();
                    setEditingProduct(null);
                }
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading font-bold uppercase">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                        <DialogDescription className="hidden">Manage product details and variants</DialogDescription>
                        <p className="text-sm text-muted-foreground">Edit product details, manage variants, and upload images</p>
                    </DialogHeader>
                    {/* Render Form Logic Here (Simplified/Merged from Products.tsx) */}
                    <form onSubmit={(e) => { e.preventDefault(); editingProduct ? updateProduct.mutate() : createProduct.mutate() }} className="space-y-6">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="basic">Product Details</TabsTrigger>
                                <TabsTrigger value="variants">Variants & Images</TabsTrigger>
                            </TabsList>
                            <TabsContent value="basic" className="space-y-4">
                                <div><Label>Name *</Label><Input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required /></div>
                                <div><Label>Description</Label><MarkdownEditor value={productForm.description || ''} onChange={e => setProductForm({ ...productForm, description: e.target.value })} placeholder="Enter description... use toolbar for formatting." /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Category</Label>
                                        <Select value={CATEGORIES.includes(productForm.category || '') ? productForm.category || '' : (productForm.category ? "Custom" : "")} onValueChange={(val) => setProductForm({ ...productForm, category: val === "Custom" ? "" : val })}>
                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                        </Select>
                                        {((productForm.category && !CATEGORIES.includes(productForm.category)) || (!CATEGORIES.includes(productForm.category || '') && productForm.category === "")) && (
                                            <Input className="mt-2" placeholder="Custom Category" value={productForm.category || ''} onChange={e => setProductForm({ ...productForm, category: e.target.value })} />
                                        )}
                                    </div>
                                    <div><Label>SKU</Label><Input value={productForm.sku || ''} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} /></div>
                                </div>
                                <div>
                                    <Label>Images</Label>
                                    <div className="flex gap-4 mt-2 overflow-x-auto pb-2">
                                        {productForm.images.map((url, i) => (
                                            <div key={i} className="relative w-20 h-20 flex-shrink-0 group">
                                                <img src={url} className="w-full h-full object-cover rounded border" />
                                                <button type="button" onClick={() => handleRemoveImage(i, url)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
                                                {i === 0 && <Badge className="absolute bottom-0 left-0 text-[8px] px-1">Main</Badge>}
                                                {i > 0 && <button type="button" onClick={() => setAsPrimary(i)} className="absolute bottom-0 left-0 bg-black/50 text-white text-[8px] px-1 group-hover:opacity-100">Set Main</button>}
                                            </div>
                                        ))}
                                        <label className="w-20 h-20 border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted group/add relative overflow-hidden">
                                            {uploadingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5 text-muted-foreground" />}
                                            <input type="file" className="hidden" accept="image/*" onChange={e => handleFileSelect(e, 'product')} disabled={uploadingImages} />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white group-hover/add:opacity-100 text-[10px] uppercase font-bold text-center p-1">
                                                Add & Edit
                                            </div>
                                        </label>
                                        <label className="w-20 h-20 border-2 border-dashed border-green-500 flex items-center justify-center cursor-pointer hover:bg-green-50 group/direct relative overflow-hidden">
                                            {uploadingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-5 h-5 text-green-600" />}
                                            <input type="file" className="hidden" accept="image/*" onChange={e => handleDirectUpload(e, 'product')} disabled={uploadingImages} />
                                            <div className="absolute inset-0 flex items-center justify-center bg-green-600/90 text-white group-hover/direct:opacity-100 text-[10px] uppercase font-bold text-center p-1">
                                                Direct (No Edit)
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex items-center space-x-2"><Checkbox id="feat" checked={productForm.featured} onCheckedChange={c => setProductForm({ ...productForm, featured: c as boolean })} /><Label htmlFor="feat">Featured</Label></div>
                                    <div className="flex items-center space-x-2"><Checkbox id="new" checked={productForm.is_new} onCheckedChange={c => setProductForm({ ...productForm, is_new: c as boolean })} /><Label htmlFor="new">New</Label></div>
                                </div>
                            </TabsContent>

                            <TabsContent value="variants" className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                    {/* Left Panel: Add/Edit Variant Form */}
                                    <div className="md:col-span-2 space-y-4 p-4 border rounded-lg bg-muted/20">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-semibold text-sm">{editingVariantId ? "Edit Variant" : "Add Variant"}</h3>
                                            {editingVariantId && <Button variant="ghost" size="sm" onClick={() => { setEditingVariantId(null); setNewVariant({ size: "", color: "", stock: "", actual_price: "", discounted_price: "", price_modifier: "0", images: [], color_code: "", is_default: false }); }}>Cancel Edit</Button>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs mb-1 block">Size</Label>
                                                <Select value={newVariant.size} onValueChange={v => setNewVariant({ ...newVariant, size: v })}>
                                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>{SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-xs mb-1 block">Color</Label>
                                                <Select
                                                    value={COLORS.includes(newVariant.color) ? newVariant.color : "Custom"}
                                                    onValueChange={v => {
                                                        if (v === "Custom") {
                                                            setNewVariant({ ...newVariant, color: "", color_code: "" });
                                                        } else {
                                                            setNewVariant({ ...newVariant, color: v, color_code: "" });
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>
                                                        {COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                        <SelectItem value="Custom">Custom</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {(!COLORS.includes(newVariant.color) || newVariant.color === "") && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input
                                                    className="w-full"
                                                    placeholder="Color Name"
                                                    value={newVariant.color}
                                                    onChange={e => setNewVariant({ ...newVariant, color: e.target.value })}
                                                />
                                                <Input
                                                    className="w-full font-mono text-xs"
                                                    placeholder="#HEX"
                                                    value={newVariant.color_code || ''}
                                                    onChange={e => setNewVariant({ ...newVariant, color_code: e.target.value })}
                                                />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label className="text-xs mb-1 block">Stock</Label><Input type="number" value={newVariant.stock} onChange={e => setNewVariant({ ...newVariant, stock: e.target.value })} /></div>
                                            <div><Label className="text-xs mb-1 block">Price</Label><Input type="number" value={newVariant.actual_price} onChange={e => setNewVariant({ ...newVariant, actual_price: e.target.value })} placeholder={productForm.base_price?.toString()} /></div>
                                        </div>

                                        <div className="flex items-center space-x-2 pt-2">
                                            <Checkbox
                                                id="is_default"
                                                checked={newVariant.is_default}
                                                onCheckedChange={(checked) => setNewVariant({ ...newVariant, is_default: checked as boolean })}
                                            />
                                            <Label htmlFor="is_default" className="text-xs cursor-pointer">Set as Default Variant (First shown)</Label>
                                        </div>

                                        <div className="border-t pt-4">
                                            <Label className="text-xs mb-2 block">Color Images (Used for all {newVariant.color || 'color'} sizes)</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {newVariant.images.map((url, idx) => (
                                                    <div key={idx} className="relative w-14 h-14 border rounded group">
                                                        <img src={url} className="w-full h-full object-cover rounded" />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newImages = newVariant.images.filter((_, i) => i !== idx);
                                                                setNewVariant({ ...newVariant, images: newImages });
                                                            }}
                                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <label className="w-14 h-14 border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted rounded transition-colors group/add relative overflow-hidden">
                                                    {uploadingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 text-muted-foreground" />}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileSelect(e, 'variant')}
                                                        disabled={uploadingImages}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover/add:opacity-100 text-[8px] uppercase font-bold text-center">
                                                        Edit
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <Button type="button" className="w-full" onClick={handleAddVariant} disabled={uploadingImages}>
                                            {uploadingImages ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (editingVariantId ? <RefreshCw className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />)}
                                            {editingVariantId ? "Update Variant" : "Add Variant"}
                                        </Button>
                                    </div>

                                    {/* Right Panel: Existing Variants Table with Pagination */}
                                    <div className="md:col-span-3 border rounded-lg overflow-hidden flex flex-col">
                                        <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
                                            <h3 className="font-semibold text-sm">Existing Variants ({variants.length})</h3>
                                        </div>
                                        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[350px]">
                                            <Table>
                                                <TableHeader><TableRow><TableHead>Image</TableHead><TableHead>Size</TableHead><TableHead>Color</TableHead><TableHead>Stock</TableHead><TableHead className="text-right">Price</TableHead><TableHead></TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {variants.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                                No variants added yet.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : [...variants].sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0) || a.color.localeCompare(b.color) || a.size.localeCompare(b.size)).map((v, idx) => (
                                                        <TableRow key={v.id || idx} className={v.is_default ? "bg-muted/30" : ""}>
                                                            <TableCell>
                                                                <Badge variant={v.images && v.images.length > 0 ? "default" : "secondary"} className="text-xs font-mono">
                                                                    {v.images?.length || 0}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="font-medium">{v.size}</TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-3 h-3 rounded-full border shadow-sm" style={{ backgroundColor: v.color_code || v.color.toLowerCase() }}></span>
                                                                    {v.color}
                                                                    {v.is_default && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200">Default</span>}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{v.stock}</TableCell>
                                                            <TableCell className="text-right">{v.actual_price}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-1">
                                                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-blue-500" onClick={() => handleEditVariantClick(v)}>
                                                                        <Edit className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className={`h-7 w-7 ${v.is_default ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 hover:text-yellow-500'}`}
                                                                        onClick={() => handleSetDefaultVariant(v.id)}
                                                                        title={v.is_default ? "Default Variant" : "Set as Default"}
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={v.is_default ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                                                    </Button>
                                                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleRemoveVariant(v.id)}>
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>


                        </Tabs>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" className="flex-1">Save Product</Button>
                        </div>
                    </form>
                </DialogContent >
            </Dialog >

            {/* Dialog: Manage Variants (Unified Stock & Price Management) */}
            < Dialog open={manageVariantsOpen} onOpenChange={setManageVariantsOpen} >
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading font-bold uppercase">Manage Variants: {selectedProductForVariants?.name}</DialogTitle>
                        <DialogDescription>Adjust stock levels and update pricing for each variant.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Quick Add Variant */}
                        <div className="flex flex-wrap gap-2 items-end bg-muted p-4 rounded-lg">
                            <div><Label className="text-xs uppercase font-bold">Size</Label><Select value={newVariant.size} onValueChange={v => setNewVariant({ ...newVariant, size: v })}><SelectTrigger className="w-24 bg-background"><SelectValue /></SelectTrigger><SelectContent>{SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label className="text-xs uppercase font-bold">Color</Label><Select value={newVariant.color} onValueChange={v => setNewVariant({ ...newVariant, color: v })}><SelectTrigger className="w-32 bg-background"><SelectValue /></SelectTrigger><SelectContent>{COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label className="text-xs uppercase font-bold">Initial Stock</Label><Input type="number" className="w-24 bg-background" value={newVariant.stock} onChange={e => setNewVariant({ ...newVariant, stock: e.target.value })} /></div>
                            <div><Label className="text-xs uppercase font-bold">Price Override</Label><Input type="number" className="w-28 bg-background" value={newVariant.actual_price} onChange={e => setNewVariant({ ...newVariant, actual_price: e.target.value })} placeholder="Inherit" /></div>
                            <div><Label className="text-xs uppercase font-bold">Discount Price</Label><Input type="number" className="w-28 bg-background" value={newVariant.discounted_price} onChange={e => setNewVariant({ ...newVariant, discounted_price: e.target.value })} placeholder="Optional" /></div>
                            <div>
                                <Label className="text-xs uppercase font-bold">Image</Label>
                                <Select value={(newVariant.images && newVariant.images.length > 0) ? newVariant.images[0] : "no-image"} onValueChange={v => setNewVariant({ ...newVariant, images: v === "no-image" ? [] : [v] })}>
                                    <SelectTrigger className="w-32 bg-background"><SelectValue placeholder="None" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no-image">No Image</SelectItem>
                                        {selectedProductForVariants?.images?.map((url, i) => (
                                            <SelectItem key={i} value={url}>
                                                <div className="flex items-center gap-2">
                                                    <img src={url} className="w-6 h-6 object-cover rounded" />
                                                    <span className="truncate max-w-[100px]">Image {i + 1}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleAddVariant} disabled={!newVariant.size || !newVariant.color}><Plus className="h-4 w-4 mr-2" /> Add Variant</Button>
                        </div>

                        {/* Variants List with Actions */}
                        <VariantList
                            variants={variants}
                            onEdit={handleEditVariantClick}
                            onRemove={handleRemoveVariant}
                            onUpdate={handleUpdateVariant}
                            onHistory={(v: any) => { setSelectedVariantForHistory(v); setHistoryDialogOpen(true); }}
                            onAdjustStock={(v: any) => handleOpenAdjustStock(v)}
                        />

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => { setManageVariantsOpen(false); setVariants([]); setSelectedProductForVariants(null); setVariantsToDelete([]); }}>Close</Button>
                            <Button onClick={() => updateProduct.mutate()}>Save Changes</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >

            {/* Dialog: Adjust Stock (History Logged) */}
            < Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen} >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-heading uppercase">Adjust Stock</DialogTitle>
                        <DialogDescription>{selectedVariantForAdjust?.size} / {selectedVariantForAdjust?.color}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="flex items-center gap-4 justify-center">
                            <Button variant="outline" size="icon" onClick={() => setAdjustmentAmount(s => String(Number(s || 0) - 1))}><Minus className="h-4 w-4" /></Button>
                            <Input type="number" className="text-center w-24 text-lg font-bold" value={adjustmentAmount} onChange={e => setAdjustmentAmount(e.target.value)} placeholder="0" />
                            <Button variant="outline" size="icon" onClick={() => setAdjustmentAmount(s => String(Number(s || 0) + 1))}><Plus className="h-4 w-4" /></Button>
                        </div>
                        <div className="text-center text-sm text-muted-foreground">
                            Current: {selectedVariantForAdjust?.stock} → New: {(selectedVariantForAdjust?.stock || 0) + Number(adjustmentAmount)}
                        </div>
                        <div>
                            <Label>Reason</Label>
                            <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                                <SelectTrigger><SelectValue placeholder="Select Reason" /></SelectTrigger>
                                <SelectContent>{STOCK_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Input value={adjustmentNotes} onChange={e => setAdjustmentNotes(e.target.value)} placeholder="Optional notes" />
                        </div>
                        <Button onClick={() => adjustStock.mutate()} className="w-full" disabled={adjustStock.isPending || !adjustmentAmount || !adjustmentReason}>
                            {adjustStock.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirm Adjustment"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog >

            {/* Dialog: Stock History */}
            < Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen} >
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle className="font-heading uppercase">Stock History</DialogTitle></DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto space-y-2">
                        {stockHistory?.map(entry => (
                            <div key={entry.id} className="border p-3 rounded flex justify-between items-center text-sm">
                                <div>
                                    <div className="font-bold uppercase flex items-center gap-2">
                                        <Badge variant={entry.change_amount > 0 ? "default" : "destructive"}>{entry.change_amount > 0 ? '+' : ''}{entry.change_amount}</Badge>
                                        {entry.reason.replace(/_/g, ' ')}
                                    </div>
                                    <div className="text-muted-foreground mt-1">{entry.previous_stock} → {entry.new_stock}</div>
                                    {entry.notes && <div className="text-xs italic mt-1">{entry.notes}</div>}
                                </div>
                                <div className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</div>
                            </div>
                        ))}
                        {stockHistory?.length === 0 && <div className="text-center text-muted-foreground py-4">No history found.</div>}
                    </div>
                </DialogContent>
            </Dialog >

            {/* Image Editor Dialog */}
            < ImageEditorDialog
                open={editorOpen}
                onOpenChange={setEditorOpen}
                file={editorFile}
                onSave={handleEditorSave}
            />
        </div >
    );
};

export default Inventory;
