import { Footer } from "@/components/Footer";
import { Helmet } from "react-helmet-async";

export default function ShippingPolicy() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Helmet>
                <title>Shipping Policy | Jager Clothing</title>
                <meta name="description" content="Read our Shipping Policy. Orders dispatched next day and delivered within 3-6 days." />
            </Helmet>

            <main className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
                <h1 className="text-4xl md:text-6xl font-heading font-bold uppercase mb-8 md:mb-12">Shipping Policy</h1>

                <div className="prose prose-lg dark:prose-invert max-w-none space-y-10 font-body text-muted-foreground">
                    <section>
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">DISPATCH & DELIVERY</h2>
                        <p>
                            All orders placed before 6pm will be dispatched the very next day and will be delivered within 3-6 days depending on region code.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">RETURNS & EXCHANGES</h2>
                        <p>
                            We don't offer return of products, but we are happy to exchange in case of any manufacturing defects or size issues if stock is available.
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div >
    );
}
