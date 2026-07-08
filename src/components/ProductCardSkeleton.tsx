import { Skeleton } from "@/components/ui/skeleton";

export const ProductCardSkeleton = () => (
    <div className="space-y-3">
        <Skeleton className="aspect-[3/4] w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
    </div>
);

export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {Array.from({ length: count }).map((_, i) => (
            <ProductCardSkeleton key={i} />
        ))}
    </div>
);
