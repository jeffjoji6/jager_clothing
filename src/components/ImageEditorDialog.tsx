import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/canvasUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Loader2, ZoomIn, Image as ImageIcon } from "lucide-react";

interface ImageEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: File | null;
    onSave: (processedBlob: Blob) => Promise<void>;
    aspectRatio?: number; // Default 3/4
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

    const [quality, setQuality] = useState(80); // 0-100
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
                quality / 100 // Convert to 0-1 range
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[90vh] sm:h-auto flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Edit Image</DialogTitle>
                    <DialogDescription>
                        Crop and optimize your image before uploading.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 relative min-h-[400px] bg-black/5">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            rotation={rotation}
                            aspect={aspectRatio}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            onRotationChange={setRotation}
                            classes={{
                                containerClassName: "bg-checkerboard",
                                mediaClassName: ""
                            }}
                        />
                    )}
                </div>

                <div className="p-6 space-y-6 bg-background border-t">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="zoom" className="flex items-center gap-2">
                                    <ZoomIn className="w-4 h-4" /> Zoom
                                </Label>
                                <span className="text-xs text-muted-foreground">{zoom.toFixed(1)}x</span>
                            </div>
                            <Slider
                                id="zoom"
                                min={1}
                                max={3}
                                step={0.1}
                                value={[zoom]}
                                onValueChange={(value) => setZoom(value[0])}
                            />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="quality" className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" /> Quality / Compression
                                </Label>
                                <span className="text-xs text-muted-foreground">{quality}%</span>
                            </div>
                            <Slider
                                id="quality"
                                min={10}
                                max={100}
                                step={5}
                                value={[quality]}
                                onValueChange={(value) => setQuality(value[0])}
                                className="[&_.bg-primary]:bg-green-500" // Custom color for quality
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Lower quality reduces file size. 80% is recommended.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={processing} className="w-full sm:w-auto">
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Save & Upload"
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};
