import { Footer } from "@/components/Footer";
import { Helmet } from "react-helmet-async";

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Helmet>
                <title>Refund Policy | Jager Clothing</title>
                <meta name="description" content="Read our Refund and Exchange Policy. Jager Clothing offers exchanges for defects and cancellations within 24 hours." />
            </Helmet>

            <main className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
                <h1 className="text-4xl md:text-6xl font-heading font-bold uppercase mb-8 md:mb-12">Refund Policy</h1>

                <div className="prose prose-lg dark:prose-invert max-w-none space-y-10 font-body text-muted-foreground">
                    <section>
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">CANCELLATION</h2>
                        <p>
                            If you would like to cancel an order within 24 hours email us - <a href="mailto:support@jagerclothing.in" className="hover:underline font-bold">support@jagerclothing.in</a>
                        </p>
                        <p className="mt-4">
                            If orders have not been dispatched due to unavailability of size or style, we will cancel the order and refund your amount within 3-5 business days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">EXCHANGES</h2>
                        <p>
                            If you would like to exchange your purchase for another size or style, please email us within 24-48 hours from the date of delivery at <a href="mailto:support@jagerclothing.in" className="hover:underline font-bold">support@jagerclothing.in</a>
                        </p>
                        <p className="mt-4">
                            Due to Limited stock exchange for items may or may not be available.
                        </p>
                        <p className="mt-4">
                            Exchanged goods can only be dispatched and shipped after the returned goods have been received by us and have undergone a quality check. The cost of shipping is borne by the customer.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">RETURNS</h2>
                        <p>
                            We don't offer return of products, but we are happy to exchange in case of any manufacturing defects or offer store credit.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">SALE ITEMS</h2>
                        <p>
                            All orders on Any Kind Of Sale is final, no returns or exchanges.
                        </p>
                    </section>

                    <section className="bg-muted p-8 rounded-lg mt-8">
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">QUESTIONS</h2>
                        <p>Questions about the Refund Policy should be sent to us at:</p>
                        <a href="mailto:support@jagerclothing.in" className="hover:underline font-bold mt-2 block">support@jagerclothing.in</a>
                    </section>
                </div>
            </main>

            <Footer />
        </div >
    );
}
