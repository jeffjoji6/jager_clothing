import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const Reports = () => {
  const [dateRange, setDateRange] = useState("month"); // week, month, year

  // Fetch sales data
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'sales', dateRange],
    queryFn: async () => {
      let startDate: Date;
      const endDate = new Date();

      switch (dateRange) {
        case "week":
          startDate = subDays(endDate, 7);
          break;
        case "month":
          startDate = startOfMonth(endDate);
          break;
        case "year":
          startDate = subMonths(endDate, 12);
          break;
        default:
          startDate = startOfMonth(endDate);
      }

      // Get orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['confirmed', 'processing', 'shipped', 'delivered'])
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get order items for product analysis
      const orderIds = orders?.map(o => o.id) || [];
      const { data: orderItems } = orderIds.length > 0
        ? await supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds)
        : { data: [] };

      // Calculate metrics
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Revenue by type
      const collectionRevenue = orders
        ?.filter(o => o.order_type === 'collection')
        .reduce((sum, o) => sum + Number(o.total || 0), 0) || 0;

      const customRevenue = orders
        ?.filter(o => o.order_type !== 'collection')
        .reduce((sum, o) => sum + Number(o.total || 0), 0) || 0;

      // Sales by day (for chart)
      const salesByDay: Record<string, number> = {};
      orders?.forEach((order) => {
        const day = format(new Date(order.created_at), 'MMM dd');
        salesByDay[day] = (salesByDay[day] || 0) + Number(order.total || 0);
      });

      const chartData = Object.entries(salesByDay)
        .map(([day, revenue]) => ({ day, revenue }))
        .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

      // Product sales
      const productSales: Record<string, number> = {};
      orderItems?.forEach((item: any) => {
        const name = item.product_name;
        productSales[name] = (productSales[name] || 0) + Number(item.price * item.quantity);
      });

      const topProducts = Object.entries(productSales)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Channel breakdown
      const channelData = [
        { name: 'Collection', value: collectionRevenue },
        { name: 'Basic Custom', value: orders?.filter(o => o.order_type === 'basic_custom').reduce((sum, o) => sum + Number(o.total || 0), 0) || 0 },
        { name: 'Pro Custom', value: orders?.filter(o => o.order_type === 'pro_custom').reduce((sum, o) => sum + Number(o.total || 0), 0) || 0 },
      ].filter(item => item.value > 0);

      return {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        collectionRevenue,
        customRevenue,
        chartData,
        topProducts,
        channelData,
      };
    },
  });

  const COLORS = ['#DC2626', '#1f2937', '#3b82f6', '#10b981'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold uppercase tracking-tight">Reports & Analytics</h1>
          <p className="text-grey-text mt-1">Business insights and performance metrics</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-heading font-bold uppercase">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-grey-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold">
              ₹{salesData?.totalRevenue.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-heading font-bold uppercase">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-grey-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold">{salesData?.totalOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-heading font-bold uppercase">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-grey-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold">
              ₹{salesData?.avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-heading font-bold uppercase">Collection %</CardTitle>
            <TrendingUp className="h-4 w-4 text-grey-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold">
              {salesData?.totalRevenue
                ? Math.round((salesData.collectionRevenue / salesData.totalRevenue) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading font-bold uppercase">Sales Trend</CardTitle>
            <CardDescription>Revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            {salesData?.chartData && salesData.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#DC2626" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-grey-text py-12">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Channel Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading font-bold uppercase">Revenue by Channel</CardTitle>
            <CardDescription>Collection vs Custom orders</CardDescription>
          </CardHeader>
          <CardContent>
            {salesData?.channelData && salesData.channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesData.channelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {salesData.channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-grey-text py-12">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading font-bold uppercase">Top Selling Products</CardTitle>
          <CardDescription>Best performing products by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {salesData?.topProducts && salesData.topProducts.length > 0 ? (
            <div className="space-y-4">
              {salesData.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-3 border border-foreground">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-grey-bg flex items-center justify-center font-heading font-bold">
                      {index + 1}
                    </span>
                    <span className="font-heading font-bold">{product.name}</span>
                  </div>
                  <span className="font-heading font-bold">₹{product.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-grey-text py-12">No data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;

