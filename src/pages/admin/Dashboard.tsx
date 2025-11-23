import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, TrendingUp, ShoppingCart, Package, AlertCircle, ArrowRight, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  newOrders: number;
  overdueOrders: number;
  proRequests: number;
  collectionRevenue: number;
  customRevenue: number;
}

interface TopProduct {
  id: string;
  name: string;
  total_sold: number;
  revenue: number;
}

const Dashboard = () => {
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: async () => {
      // Get total revenue and orders
      const { data: orders } = await supabase
        .from('orders')
        .select('total, order_type, status, created_at')
        .in('status', ['confirmed', 'processing', 'shipped', 'delivered']);

      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      
      // Get new orders (status = 'new')
      const { count: newOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

      // Get overdue orders (new or pending_print for > 2 days)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const { data: overdueOrders } = await supabase
        .from('orders')
        .select('id, status, created_at')
        .in('status', ['new', 'pending_print'])
        .lt('created_at', twoDaysAgo.toISOString());

      // Get new pro requests
      const { count: proRequestsCount } = await supabase
        .from('jager_pro_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new_request');

      // Calculate revenue by type
      const collectionRevenue = orders
        ?.filter(o => o.order_type === 'collection')
        .reduce((sum, o) => sum + Number(o.total || 0), 0) || 0;

      const customRevenue = orders
        ?.filter(o => o.order_type !== 'collection')
        .reduce((sum, o) => sum + Number(o.total || 0), 0) || 0;

      return {
        totalRevenue,
        totalOrders,
        newOrders: newOrdersCount || 0,
        overdueOrders: overdueOrders?.length || 0,
        proRequests: proRequestsCount || 0,
        collectionRevenue,
        customRevenue,
      } as DashboardStats;
    },
  });

  // Fetch overdue orders
  const { data: overdueOrders } = useQuery({
    queryKey: ['admin', 'dashboard', 'overdue-orders'],
    queryFn: async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const { data } = await supabase
        .from('orders')
        .select('id, status, created_at, total')
        .in('status', ['new', 'pending_print'])
        .lt('created_at', twoDaysAgo.toISOString())
        .order('created_at', { ascending: true })
        .limit(5);

      return data || [];
    },
  });

  // Fetch top products
  const { data: topProducts } = useQuery({
    queryKey: ['admin', 'dashboard', 'top-products'],
    queryFn: async () => {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_name, quantity, price, order:orders!inner(status)')
        .in('order.status', ['confirmed', 'processing', 'shipped', 'delivered']);

      // Aggregate by product name
      const productMap = new Map<string, { quantity: number; revenue: number }>();
      
      orderItems?.forEach((item) => {
        const existing = productMap.get(item.product_name) || { quantity: 0, revenue: 0 };
        productMap.set(item.product_name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + (item.quantity * Number(item.price)),
        });
      });

      return Array.from(productMap.entries())
        .map(([name, stats]) => ({
          id: name,
          name,
          total_sold: stats.quantity,
          revenue: stats.revenue,
        }))
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, 5) as TopProduct[];
    },
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const collectionPercentage = stats?.totalRevenue
    ? Math.round((stats.collectionRevenue / stats.totalRevenue) * 100)
    : 0;
  const customPercentage = stats?.totalRevenue
    ? Math.round((stats.customRevenue / stats.totalRevenue) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Dashboard</h1>
        <p className="text-grey-text mt-1">Overview of your business</p>
      </div>

      {/* Alerts */}
      {(stats?.overdueOrders || 0) > 0 && (
        <Alert className="border-jager-red bg-jager-red/10">
          <AlertCircle className="h-4 w-4 text-jager-red" />
          <AlertTitle className="font-heading font-bold uppercase">URGENT: Orders Overdue</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">
              You have <strong>{stats?.overdueOrders}</strong> orders that have been in "New" or "Pending Print" status for more than 2 days.
            </p>
            <Link to="/admin/orders?status=new" className="text-jager-red underline font-heading font-bold uppercase text-sm inline-flex items-center gap-1">
              View Orders <ArrowRight className="h-3 w-3" />
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {(stats?.proRequests || 0) > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-heading font-bold uppercase">New Jager Pro Requests</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">
              You have <strong>{stats?.proRequests}</strong> new Jager Pro design requests waiting for review.
            </p>
            <Link to="/admin/jager-pro?status=new_request" className="text-foreground underline font-heading font-bold uppercase text-sm inline-flex items-center gap-1">
              Review Requests <ArrowRight className="h-3 w-3" />
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-heading font-bold uppercase">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-grey-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold">₹{stats?.totalRevenue.toLocaleString() || 0}</div>
            <p className="text-xs text-grey-text mt-1">
              Collection: {collectionPercentage}% | Custom: {customPercentage}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-heading font-bold uppercase">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-grey-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-grey-text mt-1">
              {stats?.newOrders || 0} new orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-heading font-bold uppercase">New Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-grey-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold">{stats?.newOrders || 0}</div>
            <Link to="/admin/orders?status=new" className="text-xs text-jager-red underline font-heading uppercase mt-1 inline-block">
              View All
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-heading font-bold uppercase">Pro Requests</CardTitle>
            <Package className="h-4 w-4 text-grey-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold">{stats?.proRequests || 0}</div>
            <Link to="/admin/jager-pro?status=new_request" className="text-xs text-jager-red underline font-heading uppercase mt-1 inline-block">
              Review
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Orders */}
      {overdueOrders && overdueOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading font-bold uppercase">Overdue Orders</CardTitle>
            <CardDescription>Orders pending for more than 2 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-3 border border-foreground hover:bg-grey-bg transition-colors"
                >
                  <div>
                    <p className="font-heading font-bold uppercase text-sm">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-grey-text">
                      Status: {order.status} | Created: {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold">₹{Number(order.total).toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
            <Link
              to="/admin/orders?overdue=true"
              className="text-sm text-jager-red underline font-heading uppercase mt-4 inline-block"
            >
              View All Overdue Orders →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading font-bold uppercase">Top 5 Selling Products</CardTitle>
          <CardDescription>Best performing Jager Collection items</CardDescription>
        </CardHeader>
        <CardContent>
          {topProducts && topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 border border-foreground">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-grey-bg flex items-center justify-center font-heading font-bold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-heading font-bold uppercase text-sm">{product.name}</p>
                      <p className="text-xs text-grey-text">
                        {product.total_sold} units sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold">₹{product.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-grey-text text-sm">No sales data available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

