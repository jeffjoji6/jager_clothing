import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { toast } from "sonner";

const PRODUCTS = [
  { id: "tee", name: "T-Shirt", price: 799 },
  { id: "hoodie", name: "Hoodie", price: 1999 },
  { id: "cargo", name: "Cargo Pants", price: 2499 },
];

const SIZES = ["S", "M", "L", "XL", "XXL"];

const CustomLabBasic = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      toast.success("Design uploaded!");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile || !selectedProduct || !selectedSize) {
      toast.error("Please complete all fields");
      return;
    }
    
    toast.success("Order submitted!", {
      description: "You'll receive a mockup within 24 hours.",
    });
  };

  const selectedProductData = PRODUCTS.find(p => p.id === selectedProduct);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 md:mb-12">
            <h1 className="text-4xl md:text-6xl font-heading font-bold uppercase tracking-tight mb-4">
              JÄGER BASIC
            </h1>
            <p className="text-lg font-body text-grey-text">
              Upload your design and create custom apparel instantly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Upload Section */}
            <div>
              <Label className="text-lg font-heading uppercase mb-4 block">
                Upload Your Design
              </Label>
              <div className="border-2 border-dashed border-foreground p-8 md:p-12 text-center">
                {previewUrl ? (
                  <div className="space-y-4">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-64 mx-auto"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setUploadedFile(null);
                        setPreviewUrl("");
                      }}
                    >
                      CHANGE DESIGN
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-heading uppercase font-bold mb-2">
                      Click to Upload
                    </p>
                    <p className="text-sm font-body text-grey-text">
                      PNG, JPG, or SVG (Max 10MB)
                    </p>
                  </label>
                )}
              </div>
            </div>

            {/* Product Selection */}
            <div>
              <Label className="text-lg font-heading uppercase mb-4 block">
                Choose Product
              </Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ₹{product.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size & Quantity */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-lg font-heading uppercase mb-4 block">
                  Size
                </Label>
                <div className="flex gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 border-2 border-foreground font-heading font-bold uppercase transition-colors ${
                        selectedSize === size
                          ? "bg-foreground text-background"
                          : "bg-background text-foreground hover:bg-grey-bg"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-lg font-heading uppercase mb-4 block">
                  Quantity
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="text-lg font-heading"
                />
              </div>
            </div>

            {/* Price Summary */}
            {selectedProductData && (
              <div className="bg-grey-bg p-6 space-y-2">
                <div className="flex justify-between font-body">
                  <span>Product Price:</span>
                  <span>₹{selectedProductData.price}</span>
                </div>
                <div className="flex justify-between font-body">
                  <span>Quantity:</span>
                  <span>{quantity}</span>
                </div>
                <div className="flex justify-between font-heading text-xl font-bold pt-2 border-t border-foreground/20">
                  <span>TOTAL:</span>
                  <span>₹{selectedProductData.price * quantity}</span>
                </div>
              </div>
            )}

            {/* Submit */}
            <Button type="submit" variant="hero" size="lg" className="w-full">
              GET MOCKUP & ORDER
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomLabBasic;
