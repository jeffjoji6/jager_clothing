import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy Load Pages
const Home = lazy(() => import("@/pages/Home"));
const Collection = lazy(() => import("@/pages/Collection"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const CustomDesign = lazy(() => import("@/pages/CustomDesign"));
const TrackRequest = lazy(() => import("@/pages/TrackRequest"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const AuthCallback = lazy(() => import("@/pages/AuthCallback"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const OrderConfirmation = lazy(() => import("@/pages/OrderConfirmation"));
const Orders = lazy(() => import("@/pages/Orders"));
const Profile = lazy(() => import("@/pages/Profile"));
const CookiePolicy = lazy(() => import("@/pages/CookiePolicy"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));
const ShippingPolicy = lazy(() => import("@/pages/ShippingPolicy"));
const Contact = lazy(() => import("@/pages/Contact"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Admin Imports (Lazy)
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";

const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminOrders = lazy(() => import("@/pages/admin/Orders"));
const AdminOrderDetail = lazy(() => import("@/pages/admin/OrderDetail"));
const AdminCustomers = lazy(() => import("@/pages/admin/Customers"));
const AdminCoupons = lazy(() => import("@/pages/admin/Coupons"));
const AdminInventory = lazy(() => import("@/pages/admin/Inventory"));
const AdminCustomProducts = lazy(() => import("@/pages/admin/CustomProducts"));
const AdminJagerPro = lazy(() => import("@/pages/admin/JagerPro"));
const AdminDesignRequests = lazy(() => import("@/pages/admin/DesignRequests"));
const AdminReports = lazy(() => import("@/pages/admin/Reports"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminBilling = lazy(() => import("@/pages/admin/Billing"));

// Transition Wrapper for Pages
import { motion } from "framer-motion";

const PageTransition = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
    >
        {children}
    </motion.div>
);

const PageLoader = () => (
    <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
    </div>
);

import { Header } from "@/components/Header";

export const AnimatedRoutes = () => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <>
            {!isAdminRoute && <Header />}
            <AnimatePresence mode="wait">
                <Suspense fallback={<PageLoader />}>
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                        <Route path="/cookie-policy" element={<PageTransition><CookiePolicy /></PageTransition>} />
                        <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
                        <Route path="/terms-of-service" element={<PageTransition><TermsOfService /></PageTransition>} />
                        <Route path="/refund-policy" element={<PageTransition><RefundPolicy /></PageTransition>} />
                        <Route path="/shipping-policy" element={<PageTransition><ShippingPolicy /></PageTransition>} />
                        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
                        <Route path="/collection" element={<PageTransition><Collection /></PageTransition>} />
                        <Route path="/product/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
                        <Route path="/custom-design" element={<PageTransition><CustomDesign /></PageTransition>} />
                        <Route path="/track-request" element={<PageTransition><TrackRequest /></PageTransition>} />

                        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                        <Route path="/auth/reset-password" element={<ResetPassword />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/profile" element={<Profile />} />

                        {/* Admin Routes */}
                        <Route path="/admin" element={
                            <AdminProtectedRoute>
                                <AdminLayout>
                                    <AdminDashboard />
                                </AdminLayout>
                            </AdminProtectedRoute>
                        } />
                        <Route path="/admin/orders" element={
                            <AdminProtectedRoute>
                                <AdminLayout>
                                    <AdminOrders />
                                </AdminLayout>
                            </AdminProtectedRoute>
                        } />
                        <Route path="/admin/orders/:id" element={
                            <AdminProtectedRoute>
                                <AdminLayout>
                                    <AdminOrderDetail />
                                </AdminLayout>
                            </AdminProtectedRoute>
                        } />
                        <Route path="/admin/customers" element={
                            <AdminProtectedRoute>
                                <AdminLayout>
                                    <AdminCustomers />
                                </AdminLayout>
                            </AdminProtectedRoute>
                        } />
                        <Route path="/admin/coupons" element={
                            <AdminProtectedRoute>
                                <AdminLayout>
                                    <AdminCoupons />
                                </AdminLayout>
                            </AdminProtectedRoute>
                        } />
                        <Route path="/admin/inventory" element={
                            <AdminProtectedRoute>
                                <AdminLayout>
                                    <AdminInventory />
                                </AdminLayout>
                            </AdminProtectedRoute>
                        } />
                        <Route path="/admin/custom-products" element={
                            <AdminProtectedRoute>
                                <AdminLayout>
                                    <AdminCustomProducts />
                                </AdminLayout>
                            </AdminProtectedRoute>
                        } />
                        <Route path="/admin/jager-pro" element={
                            <AdminProtectedRoute requiredRole="designer">
                                <AdminLayout>
                                    <AdminJagerPro />
                                </AdminLayout>
                            </AdminProtectedRoute>
                        } />
                        <Route path="/admin/design-requests" element={
                            <AdminProtectedRoute requiredRole="designer">
                                <AdminLayout>
                                    <AdminDesignRequests />
                                </AdminLayout>
                            </AdminProtectedRoute>
                        } />
                        <Route path="/admin/reports" element={
                            <AdminProtectedRoute requiredRole="admin">
                                <AdminLayout>
                                    <AdminReports />
                                </AdminLayout>
                            </AdminProtectedRoute>
                        } />
                        <Route path="/admin/settings" element={
                            <AdminProtectedRoute requiredRole="admin">
                                <AdminLayout>
                                    <AdminSettings />
                                </AdminLayout>
                            </AdminProtectedRoute>
                        } />
                        <Route path="/admin/billing" element={
                            <AdminProtectedRoute requiredRole="admin">
                                <AdminLayout>
                                    <AdminBilling />
                                </AdminLayout>
                            </AdminProtectedRoute>
                        } />

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </AnimatePresence>
        </>
    );
};
