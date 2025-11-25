import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import ProductDetail from "./pages/ProductDetail";
import CustomLab from "./pages/CustomLab";
import CustomLabBasic from "./pages/CustomLabBasic";
import CustomLabPro from "./pages/CustomLabPro";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminOrderDetail from "./pages/admin/OrderDetail";
import AdminCustomers from "./pages/admin/Customers";
import AdminProducts from "./pages/admin/Products";
import AdminJagerPro from "./pages/admin/JagerPro";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";
import AdminBilling from "./pages/admin/Billing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/collection" element={<Collection />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/custom-lab" element={<CustomLab />} />
              <Route path="/custom-lab/basic" element={<CustomLabBasic />} />
              <Route path="/custom-lab/pro" element={<CustomLabPro />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
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
              <Route path="/admin/products" element={
                <AdminProtectedRoute>
                  <AdminLayout>
                    <AdminProducts />
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
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
