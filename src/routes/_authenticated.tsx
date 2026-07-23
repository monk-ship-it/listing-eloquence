import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { amIAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";
import { PenLine, History, CreditCard, User, Shield, Menu, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,follow" }],
  }),
  component: AuthenticatedLayout,
});

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/app", label: "Generator", icon: PenLine },
  { to: "/history", label: "History", icon: History },
  { to: "/subscription", label: "Subscription", icon: CreditCard },
  { to: "/account", label: "Account", icon: User },
  { to: "/admin", label: "Admin", icon: Shield, adminOnly: true },
];

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const adminFn = useServerFn(amIAdmin);
  const adminQuery = useQuery({
    queryKey: ["am-i-admin"],
    queryFn: () => adminFn(),
    enabled: !!user,
  });
  const isAdmin = adminQuery.data ?? false;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out.");
    navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-5">
          {/* Brand */}
          <Link to="/app" className="flex min-w-0 items-center">
            <Logo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center justify-center gap-1 md:flex">
            {items.map((item) => {
              const active = pathname === item.to;
              return (
                <Button
                  key={item.to}
                  asChild
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Link to={item.to}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="hidden gap-2 text-muted-foreground md:inline-flex"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </Button>

            {/* Mobile menu */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <div className="flex h-16 items-center border-b border-border/60 px-5">
                  <SheetTitle asChild>
                    <Logo />
                  </SheetTitle>
                </div>
                <nav className="flex flex-col gap-1 p-3">
                  {items.map((item) => {
                    const active = pathname === item.to;
                    return (
                      <SheetClose asChild key={item.to}>
                        <Link
                          to={item.to}
                          className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                            active
                              ? "bg-secondary text-secondary-foreground"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>
                <div className="border-t border-border/60 p-3">
                  <p className="px-3 pb-2 text-xs text-muted-foreground truncate">{user.email}</p>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
