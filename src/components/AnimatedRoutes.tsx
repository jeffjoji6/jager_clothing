import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Import Pages
import Home from "@/pages/Home";
import Collection from "@/pages/Collection";
import ProductDetail from "@/pages/ProductDetail";
import CustomDesign from "@/pages/CustomDesign";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import AuthCallback from "@/pages/AuthCallback";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import Orders from "@/pages/Orders";
import Profile from "@/pages/Profile";
import CookiePolicy from "@/pages/CookiePolicy";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import RefundPolicy from "@/pages/RefundPolicy";
import ShippingPolicy from "@/pages/ShippingPolicy";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";

// Admin Imports
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminOrders from "@/pages/admin/Orders";
import AdminOrderDetail from "@/pages/admin/OrderDetail";
import AdminCustomers from "@/pages/admin/Customers";
import AdminCoupons from "@/pages/admin/Coupons";
// import AdminProducts from "@/pages/admin/Products"; // File not found
import AdminInventory from "@/pages/admin/Inventory";
import AdminCustomProducts from "@/pages/admin/CustomProducts";
import AdminJagerPro from "@/pages/admin/JagerPro";
import AdminDesignRequests from "@/pages/admin/DesignRequests";
import AdminReports from "@/pages/admin/Reports";
import AdminSettings from "@/pages/admin/Settings";
import AdminBilling from "@/pages/admin/Billing";

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

import { Header } from "@/components/Header";

export const AnimatedRoutes = () => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <>
            {!isAdminRoute && <Header />}
            <AnimatePresence mode="wait">
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

                    <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                    <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                    <Route path="/auth/reset-password" element={<ResetPassword />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/profile" element={<Profile />} />

                    {/* Admin Routes - No Transition needed usually, or keep it standard */}
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
            </AnimatePresence>
        </>
    );
};
