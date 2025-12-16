import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface SizeChartModalProps {
    children: React.ReactNode;
}

export const SizeChartModal = ({ children }: SizeChartModalProps) => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] md:max-w-2xl bg-white p-0 overflow-hidden border-none rounded-sm shadow-2xl [&>button]:hidden">
                <div className="relative w-full h-full max-h-[80vh] overflow-y-auto scrollbar-hide">
                    <img
                        src="/size-chart.png"
                        alt="Jager Clothing Size Chart"
                        className="w-full h-auto object-contain block"
                    />
                </div>

                {/* Custom Close Button */}
                <DialogClose className="absolute top-4 right-4 z-50 p-2 bg-white/50 backdrop-blur-md border border-black/20 text-black rounded-sm hover:bg-black hover:text-white transition-all duration-500 hover:rotate-180 focus:outline-none focus:ring-2 focus:ring-black">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
};
