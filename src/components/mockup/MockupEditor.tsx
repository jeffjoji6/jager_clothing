import { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCw, RotateCcw, Download, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";

export interface DesignPosition {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  imageUrl: string;
}

interface MockupEditorProps {
  productImageUrl: string;
  designImageUrl: string | null;
  side: "front" | "back";
  onDesignChange?: (position: DesignPosition | null) => void;
  onExport?: (imageUrl: string) => void;
}

export const MockupEditor = ({
  productImageUrl,
  designImageUrl,
  side,
  onDesignChange,
  onExport,
}: MockupEditorProps) => {
  const [position, setPosition] = useState<DesignPosition>({
    x: 0,
    y: 0,
    scale: 0.35,
    rotation: 0,
    imageUrl: designImageUrl || "",
  });

  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const designRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Center design initially when image or side changes
  useEffect(() => {
    if (designImageUrl && containerRef.current && !isInitialized) {
      const container = containerRef.current;
      const containerWidth = container.offsetWidth || 400;
      const containerHeight = container.offsetHeight || 533;
      
      // Calculate center position - different for front vs back
      const designSize = 200 * 0.35; // Base size at 35% scale
      const centerX = (containerWidth / 2) - 100; // Center horizontally
      
      // Different Y position for front (chest) vs back
      const centerY = side === "front" 
        ? (containerHeight * 0.25) - 100 // Upper chest area for front
        : (containerHeight * 0.35) - 100; // Upper back area for back
      
      setPosition({
        x: centerX,
        y: centerY,
        scale: 0.35,
        rotation: 0,
        imageUrl: designImageUrl,
      });
      setIsInitialized(true);
    }
    
    // Reset initialization when design image changes
    if (!designImageUrl) {
      setIsInitialized(false);
    }
  }, [designImageUrl, side, isInitialized]);

  // Notify parent of changes
  useEffect(() => {
    if (designImageUrl && onDesignChange && isInitialized) {
      onDesignChange(position);
    } else if (!designImageUrl && onDesignChange) {
      onDesignChange(null);
    }
  }, [position, designImageUrl, onDesignChange, isInitialized]);

  const handleDrag = (_e: any, data: any) => {
    setPosition(prev => ({
      ...prev,
      x: data.x,
      y: data.y,
    }));
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (value: number[]) => {
    const newScale = value[0] / 100;
    setPosition(prev => ({
      ...prev,
      scale: newScale,
    }));
  };

  const handleRotation = (direction: "left" | "right") => {
    setPosition(prev => ({
      ...prev,
      rotation: (prev.rotation + (direction === "right" ? 15 : -15)) % 360,
    }));
  };

  const handlePositionChange = (axis: "x" | "y", value: string) => {
    const numValue = parseFloat(value) || 0;
    setPosition(prev => ({
      ...prev,
      [axis]: numValue,
    }));
  };

  const resetPosition = () => {
    if (containerRef.current && designImageUrl) {
      const container = containerRef.current;
      const containerWidth = container.offsetWidth || 400;
      const containerHeight = container.offsetHeight || 533;
      
      const designSize = 200 * 0.35;
      const centerX = (containerWidth / 2) - 100;
      const centerY = side === "front" 
        ? (containerHeight * 0.25) - 100
        : (containerHeight * 0.35) - 100;
      
      setPosition({
        x: centerX,
        y: centerY,
        scale: 0.35,
        rotation: 0,
        imageUrl: designImageUrl,
      });
      setZoom(1);
    }
  };

  const generateMockupImage = async () => {
    if (!canvasRef.current || !designImageUrl) {
      toast.error("Please add a design first");
      return;
    }

    try {
      toast.loading("Generating mockup...", { id: "mockup-gen" });
      
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imageUrl = canvas.toDataURL("image/png");
      
      if (onExport) {
        onExport(imageUrl);
      }

      toast.success("Mockup generated!", { id: "mockup-gen" });
      return imageUrl;
    } catch (error: any) {
      toast.error(`Failed to generate mockup: ${error.message}`, { id: "mockup-gen" });
      console.error("Mockup generation error:", error);
    }
  };

  const downloadMockup = async () => {
    const imageUrl = await generateMockupImage();
    if (imageUrl) {
      const link = document.createElement("a");
      link.download = `mockup-${side}-${Date.now()}.png`;
      link.href = imageUrl;
      link.click();
    }
  };

  if (!designImageUrl) {
    return (
      <div className="border-2 border-dashed border-foreground p-12 text-center rounded">
        <p className="text-grey-text font-body">Upload a design to see the mockup editor</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative border-2 border-foreground bg-grey-bg rounded overflow-hidden mx-auto"
        style={{
          width: "100%",
          maxWidth: "400px",
          aspectRatio: "3/4",
          touchAction: "none",
        }}
      >
        <div
          ref={canvasRef}
          className="relative w-full h-full"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {/* Product Base Image - T-Shirt Mockup (Flat, no person) */}
          <img
            src={productImageUrl}
            alt={`${side === "front" ? "Front" : "Back"} T-Shirt Mockup`}
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />

          {/* Draggable Design Layer */}
          {designImageUrl && (
            <Draggable
              nodeRef={designRef}
              position={{ x: position.x, y: position.y }}
              onDrag={handleDrag}
              onStart={handleDragStart}
              onStop={handleDragStop}
              bounds="parent"
              handle=".design-handle"
            >
              <div
                ref={designRef}
                className="absolute design-handle cursor-move"
                style={{
                  transform: `rotate(${position.rotation}deg) scale(${position.scale})`,
                  transformOrigin: "center center",
                  opacity: isDragging ? 0.8 : 1,
                  transition: isDragging ? "none" : "opacity 0.2s",
                  width: "200px",
                  height: "200px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                }}
              >
                <img
                  src={designImageUrl}
                  alt="Your Design"
                  className="max-w-full max-h-full object-contain drop-shadow-lg pointer-events-none"
                  draggable={false}
                  style={{
                    filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))",
                  }}
                />
                {isDragging && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-foreground text-background px-2 py-1 rounded font-heading whitespace-nowrap z-20">
                    Dragging...
                  </div>
                )}
              </div>
            </Draggable>
          )}
        </div>
      </div>

      {/* Controls Panel */}
      <div className="border-2 border-foreground p-4 space-y-4 bg-background rounded">
        {/* Zoom Controls */}
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm font-heading uppercase">Zoom</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-body min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scale Control */}
        <div>
          <Label className="text-sm font-heading uppercase mb-2 block">
            Size: {Math.round(position.scale * 100)}%
          </Label>
          <Slider
            value={[position.scale * 100]}
            onValueChange={handleScaleChange}
            min={10}
            max={200}
            step={5}
            className="w-full"
          />
        </div>

        {/* Position Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-heading uppercase mb-1 block">X Position</Label>
            <Input
              type="number"
              value={Math.round(position.x)}
              onChange={(e) => handlePositionChange("x", e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-heading uppercase mb-1 block">Y Position</Label>
            <Input
              type="number"
              value={Math.round(position.y)}
              onChange={(e) => handlePositionChange("y", e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {/* Rotation Controls */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-heading uppercase flex-1">
            Rotation: {position.rotation}°
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRotation("left")}
            title="Rotate Left"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRotation("right")}
            title="Rotate Right"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-foreground/20">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetPosition}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            type="button"
            variant="hero"
            size="sm"
            onClick={downloadMockup}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};
