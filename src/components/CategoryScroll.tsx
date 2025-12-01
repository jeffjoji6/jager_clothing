import { Link } from "react-router-dom";

const categories = [
    { name: "New Arrivals", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=300&auto=format&fit=crop", link: "/new-arrivals" },
    { name: "Hoodies", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=300&auto=format&fit=crop", link: "/collection?category=hoodies" },
    { name: "Tees", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=300&auto=format&fit=crop", link: "/collection?category=tees" },
    { name: "Bottoms", image: "https://images.unsplash.com/photo-1542272617-08f08630329f?q=80&w=300&auto=format&fit=crop", link: "/collection?category=bottoms" },
    { name: "Custom Lab", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=300&auto=format&fit=crop", link: "/custom-lab" },
];

export const CategoryScroll = () => {
    return (
        <div className="py-8 border-b border-border">
            <div className="container mx-auto px-4">
                <h3 className="text-sm font-heading font-bold uppercase tracking-widest mb-4 md:hidden">Shop by Category</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                    {categories.map((cat) => (
                        <Link
                            key={cat.name}
                            to={cat.link}
                            className="flex flex-col items-center gap-2 min-w-[80px] snap-start group"
                        >
                            <div className="w-20 h-20 rounded-full overflow-hidden border border-border group-hover:border-foreground transition-colors">
                                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs font-heading font-bold uppercase text-center whitespace-nowrap">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};
