import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Settings,
  BarChart3,
  FileText,
  Palette,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/admin",
    roles: ["admin", "staff", "designer"],
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    url: "/admin/orders",
    roles: ["admin", "staff"],
  },
  {
    title: "Jager Pro",
    icon: Palette,
    url: "/admin/jager-pro",
    roles: ["admin", "staff", "designer"],
  },
  {
    title: "Products",
    icon: Package,
    url: "/admin/products",
    roles: ["admin", "staff"],
  },
  {
    title: "Customers",
    icon: Users,
    url: "/admin/customers",
    roles: ["admin", "staff"],
  },
  {
    title: "Reports",
    icon: BarChart3,
    url: "/admin/reports",
    roles: ["admin"],
  },
  {
    title: "Billing",
    icon: FileText,
    url: "/admin/billing",
    roles: ["admin"],
  },
  {
    title: "Settings",
    icon: Settings,
    url: "/admin/settings",
    roles: ["admin"],
  },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: admin } = useAdmin();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success("Signed out from admin panel");
  };

  const filteredMenuItems = menuItems.filter((item) =>
    admin ? item.roles.includes(admin.role) : false
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <Sidebar>
        <SidebarHeader className="border-b border-foreground">
          <div className="flex items-center gap-2 px-4 py-4">
            <img src="/jager_logo.png" alt="Jager Logo" className="h-8 w-auto" />
            <div>
              <h2 className="text-lg font-heading font-bold uppercase tracking-tight">JÄGER</h2>
              <p className="text-xs text-grey-text">Admin Panel</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-heading font-bold uppercase text-grey-text">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.url || 
                    (item.url !== "/admin" && location.pathname.startsWith(item.url));
                  
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="font-heading uppercase text-sm"
                      >
                        <Link to={item.url}>
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <div className="border-t border-foreground p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-bold uppercase truncate">
                {user?.email}
              </p>
              <p className="text-xs text-grey-text capitalize">{admin?.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs font-heading uppercase"
              onClick={() => navigate("/")}
            >
              View Site
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-xs font-heading uppercase"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Sidebar>
        <SidebarInset className="flex-1 overflow-auto">
          <main className="flex-1 p-6 md:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

