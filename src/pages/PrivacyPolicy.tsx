import { Footer } from "@/components/Footer";
import { Helmet } from "react-helmet-async";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Helmet>
                <title>Privacy Policy | Jager Clothing</title>
                <meta name="description" content="Read our Privacy Policy to understand how Jager Clothing collects, uses, and protects your personal information." />
            </Helmet>



            <main className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
                <h1 className="text-4xl md:text-6xl font-heading font-bold uppercase mb-8 md:mb-12">Privacy Policy</h1>

                <div className="prose prose-lg dark:prose-invert max-w-none space-y-10 font-body text-muted-foreground">
                    <section>
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">SECTION 1 - WHAT DO WE DO WITH YOUR INFORMATION?</h2>
                        <div className="space-y-4">
                            <p>When you purchase something from our store, as part of the buying and selling process, we collect the personal information you give us such as your name, address and email address.</p>
                            <p>When you browse our store, we also automatically receive your computer’s internet protocol (IP) address in order to provide us with information that helps us learn about your browser and operating system.</p>
                            <p>Email marketing (if applicable): With your permission, we may send you emails about our store, new products and other updates.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">SECTION 2 - CONSENT</h2>
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-foreground">How do you get my consent?</h3>
                            <p>When you provide us with personal information to complete a transaction, verify your credit card, place an order, arrange for a delivery or return a purchase, we imply that you consent to our collecting it and using it for that specific reason only.</p>
                            <p>If we ask for your personal information for a secondary reason, like marketing, we will either ask you directly for your expressed consent, or provide you with an opportunity to say no.</p>

                            <h3 className="text-lg font-bold text-foreground">How do I withdraw my consent?</h3>
                            <p>If after you opt-in, you change your mind, you may withdraw your consent for us to contact you, for the continued collection, use or disclosure of your information, at anytime, by contacting us at <a href="mailto:jagerclothing.store@gmail.com" className="text-jager-red hover:underline">jagerclothing.store@gmail.com</a> or mailing us at:</p>
                            <address className="not-italic bg-accent/20 p-4 rounded-md">
                                Korappath Ln, Kuriachira,<br />
                                Thrissur, Kerala - 680006
                            </address>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">SECTION 3 - DISCLOSURE</h2>
                        <p>We may disclose your personal information if we are required by law to do so or if you violate our Terms of Service.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">SECTION 4 - PAYMENT</h2>
                        <div className="space-y-4">
                            <p>We use Razorpay for processing payments. We/Razorpay do not store your card data on their servers. The data is encrypted through the Payment Card Industry Data Security Standard (PCI-DSS) when processing payment. Your purchase transaction data is only used as long as is necessary to complete your purchase transaction. After that is complete, your purchase transaction information is not saved.</p>
                            <p>Our payment gateway adheres to the standards set by PCI-DSS as managed by the PCI Security Standards Council, which is a joint effort of brands like Visa, MasterCard, American Express and Discover.</p>
                            <p>PCI-DSS requirements help ensure the secure handling of credit card information by our store and its service providers.</p>
                            <p>For more insight, you may also want to read terms and conditions of razorpay on <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer" className="text-jager-red hover:underline">https://razorpay.com</a></p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">SECTION 5 - THIRD-PARTY SERVICES</h2>
                        <div className="space-y-4">
                            <p>In general, the third-party providers used by us will only collect, use and disclose your information to the extent necessary to allow them to perform the services they provide to us.</p>
                            <p>However, certain third-party service providers, such as payment gateways and other payment transaction processors, have their own privacy policies in respect to the information we are required to provide to them for your purchase-related transactions.</p>
                            <p>For these providers, we recommend that you read their privacy policies so you can understand the manner in which your personal information will be handled by these providers.</p>
                            <p>In particular, remember that certain providers may be located in or have facilities that are located a different jurisdiction than either you or us. So if you elect to proceed with a transaction that involves the services of a third-party service provider, then your information may become subject to the laws of the jurisdiction(s) in which that service provider or its facilities are located.</p>
                            <p>Once you leave our store’s website or are redirected to a third-party website or application, you are no longer governed by this Privacy Policy or our website’s Terms of Service.</p>

                            <h3 className="text-lg font-bold text-foreground mt-4">Links</h3>
                            <p>When you click on links on our store, they may direct you away from our site. We are not responsible for the privacy practices of other sites and encourage you to read their privacy statements.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">SECTION 6 - SECURITY</h2>
                        <p>To protect your personal information, we take reasonable precautions and follow industry best practices to make sure it is not inappropriately lost, misused, accessed, disclosed, altered or destroyed.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">SECTION 7 - COOKIES</h2>
                        <p>We use cookies to maintain session of your user. It is not used to personally identify you on other websites.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">SECTION 8 - AGE OF CONSENT</h2>
                        <p>By using this site, you represent that you are at least the age of majority in your state or province of residence, or that you are the age of majority in your state or province of residence and you have given us your consent to allow any of your minor dependents to use this site.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">SECTION 9 - CHANGES TO THIS PRIVACY POLICY</h2>
                        <div className="space-y-4">
                            <p>We reserve the right to modify this privacy policy at any time, so please review it frequently. Changes and clarifications will take effect immediately upon their posting on the website. If we make material changes to this policy, we will notify you here that it has been updated, so that you are aware of what information we collect, how we use it, and under what circumstances, if any, we use and/or disclose it.</p>
                            <p>If our store is acquired or merged with another company, your information may be transferred to the new owners so that we may continue to sell products to you.</p>
                        </div>
                    </section>

                    <section className="bg-muted p-8 rounded-lg mt-8">
                        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">QUESTIONS AND CONTACT INFORMATION</h2>
                        <p className="mb-4">If you would like to: access, correct, amend or delete any personal information we have about you, register a complaint, or simply want more information contact our Privacy Compliance Officer at:</p>
                        <div className="font-bold text-foreground">
                            <a href="mailto:support@jagerclothing.in" className="text-jager-red hover:underline block mb-2">support@jagerclothing.in</a>
                            <address className="not-italic">
                                Korappath Ln, Kuriachira,<br />
                                Thrissur, Kerala - 680006
                            </address>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div >
    );
}
