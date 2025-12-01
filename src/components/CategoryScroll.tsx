import { Link } from "react-router-dom";

const categories = [
    { name: "New Arrivals", image: "/categories/new.png", link: "/new-arrivals" },
    { name: "Hoodies", image: "/categories/hoodie.png", link: "/collection?category=hoodies" },
    { name: "Tees", image: "/categories/tee.png", link: "/collection?category=tees" },
    { name: "Bottoms", image: "/categories/pant.png", link: "/collection?category=bottoms" },
    { name: "Custom Lab", image: "/categories/lab.png", link: "/custom-lab" },
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
