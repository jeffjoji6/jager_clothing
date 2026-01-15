import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/canvasUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ZoomIn, RotateCw, Sun, Contrast, Palette, Ratio, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: File | null;
    onSave: (processedBlob: Blob) => Promise<void>;
    aspectRatio?: number; // Initial aspect ratio
}

export const ImageEditorDialog = ({
    open,
    onOpenChange,
    file,
    onSave,
    aspectRatio = 3 / 4,
}: ImageEditorDialogProps) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    // Editor State
    const [activeTab, setActiveTab] = useState("crop");
    const [currentAspect, setCurrentAspect] = useState<number | undefined>(aspectRatio);

    // Filters
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [quality, setQuality] = useState(100); // 0-100

    const [processing, setProcessing] = useState(false);

    // Load file into preview
    useEffect(() => {
        if (file) {
            const reader = new FileReader();
            reader.addEventListener("load", () => setImageSrc(reader.result as string));
            reader.readAsDataURL(file);
        } else {
            setImageSrc(null);
        }
    }, [file]);

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        try {
            setProcessing(true);
            const croppedBlob = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation,
                { horizontal: false, vertical: false },
                quality / 100, // Convert to 0-1 range
                { brightness, contrast, saturation }
            );

            if (croppedBlob) {
                await onSave(croppedBlob);
                onOpenChange(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setProcessing(false);
        }
    };

    const resetFilters = () => {
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[90vh] sm:h-auto flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Edit Image</DialogTitle>
                    <DialogDescription>
                        Crop, rotate, and enhance your image.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 relative min-h-[400px] bg-black/5">
                    {imageSrc && (
                        <div style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` }} className="w-full h-full absolute inset-0">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={currentAspect}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                onRotationChange={setRotation}
                                restrictPosition={false}
                                classes={{
                                    containerClassName: "bg-checkerboard",
                                    mediaClassName: ""
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="bg-background border-t">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="border-b px-6">
                            <TabsList className="h-12 w-full justify-start gap-6 bg-transparent p-0">
                                <TabsTrigger value="crop" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">
                                    Crop & Rotate
                                </TabsTrigger>
                                <TabsTrigger value="adjust" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0">
                                    Adjust Colors
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-6 space-y-6">
                            <TabsContent value="crop" className="mt-0 space-y-6">
                                {/* Aspect Ratio */}
                                <div className="space-y-3">
                                    <Label className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-2">
                                        <Ratio className="w-3 h-3" /> Aspect Ratio
                                    </Label>
                                    <div className="flex flex-wrap gap-2">

                                        <Button
                                            variant={currentAspect === 1 ? "secondary" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentAspect(1)}
                                            className="text-xs"
                                        >
                                            Square (1:1)
                                        </Button>
                                        <Button
                                            variant={currentAspect === 3 / 4 ? "secondary" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentAspect(3 / 4)}
                                            className="text-xs"
                                        >
                                            Portrait (3:4)
                                        </Button>
                                        <Button
                                            variant={currentAspect === 16 / 9 ? "secondary" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentAspect(16 / 9)}
                                            className="text-xs"
                                        >
                                            Landscape (16:9)
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <Label className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-2">
                                                <ZoomIn className="w-3 h-3" /> Scale
                                            </Label>
                                            <span className="text-xs text-muted-foreground">{zoom.toFixed(1)}x</span>
                                        </div>
                                        <Slider
                                            min={0.2}
                                            max={3}
                                            step={0.1}
                                            value={[zoom]}
                                            onValueChange={(v) => setZoom(v[0])}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <Label className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-2">
                                                <RotateCw className="w-3 h-3" /> Rotate
                                            </Label>
                                            <span className="text-xs text-muted-foreground">{rotation}°</span>
                                        </div>
                                        <Slider
                                            min={0}
                                            max={360}
                                            step={1}
                                            value={[rotation]}
                                            onValueChange={(v) => setRotation(v[0])}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="adjust" className="mt-0 space-y-6">
                                <div className="flex justify-end">
                                    <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-6">
                                        Reset Filters
                                    </Button>
                                </div>
                                <div className="grid gap-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <Label className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-2">
                                                <Sun className="w-3 h-3" /> Brightness
                                            </Label>
                                            <span className="text-xs text-muted-foreground">{brightness}%</span>
                                        </div>
                                        <Slider
                                            min={0}
                                            max={200}
                                            step={5}
                                            value={[brightness]}
                                            onValueChange={(v) => setBrightness(v[0])}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <Label className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-2">
                                                <Contrast className="w-3 h-3" /> Contrast
                                            </Label>
                                            <span className="text-xs text-muted-foreground">{contrast}%</span>
                                        </div>
                                        <Slider
                                            min={0}
                                            max={200}
                                            step={5}
                                            value={[contrast]}
                                            onValueChange={(v) => setContrast(v[0])}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <Label className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-2">
                                                <Palette className="w-3 h-3" /> Saturation
                                            </Label>
                                            <span className="text-xs text-muted-foreground">{saturation}%</span>
                                        </div>
                                        <Slider
                                            min={0}
                                            max={200}
                                            step={5}
                                            value={[saturation]}
                                            onValueChange={(v) => setSaturation(v[0])}
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>

                    {/* Footer Section - Outside Tabs */}
                    <div className="p-6 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="w-full sm:w-1/3 space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" /> Quality
                                </Label>
                                <span className="text-xs text-muted-foreground">{quality}%</span>
                            </div>
                            <Slider
                                min={10}
                                max={100}
                                step={5}
                                value={[quality]}
                                onValueChange={(v) => setQuality(v[0])}
                                className="[&_.bg-primary]:bg-green-500"
                            />
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing} className="flex-1 sm:flex-none">
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={processing} className="flex-1 sm:flex-none min-w-[120px]">
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Wait...
                                    </>
                                ) : (
                                    "Save Image"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
