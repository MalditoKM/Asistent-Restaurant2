
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  History,
  LogOut,
  Menu,
  ShieldAlert,
  ShoppingBasket,
  ShoppingCart,
  Tag,
  Users,
  UsersRound,
  Package,
  BookMarked,
  LayoutDashboard,
  UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Restaurant, User } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { InstallPwaButton } from '@/components/common/install-pwa-button';
import { getAllRestaurantsWithUsers } from '@/lib/server/actions';
import { DashboardSkeleton } from '@/components/common/dashboard-skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);


  useEffect(() => {
    let userData: string | null = null;
    try {
      userData = sessionStorage.getItem('loggedInUser');
    } catch (e) {
      console.error("No se pudo acceder a sessionStorage:", e);
      router.replace('/');
      return;
    }

    if (!userData) {
      router.replace('/');
      return;
    }
    
    const currentUser = JSON.parse(userData) as User;
    setUser(currentUser);
    
    const loggedInRestaurant = sessionStorage.getItem('loggedInRestaurant');
    if (currentUser.role === 'superadmin') {
      const savedRestaurantId = sessionStorage.getItem('activeRestaurantId');
      setActiveRestaurantId(savedRestaurantId || 'all');
    } else if (loggedInRestaurant) {
      setActiveRestaurantId(loggedInRestaurant);
    }
    
    setIsHydrated(true);

  }, [router]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const data = await getAllRestaurantsWithUsers();
      setAllRestaurants(data);
      setIsLoading(false);
    }
    if (isHydrated) {
        fetchData();
    }
  }, [isHydrated]);
  
  const currentRestaurant = useMemo(() => {
    if (user?.role === 'superadmin' && activeRestaurantId === 'all') {
      return { id: 'all', name: 'Todos los Restaurantes' };
    }
    if (!allRestaurants || !activeRestaurantId) return null;
    return allRestaurants.find(r => r.id === activeRestaurantId);
  }, [allRestaurants, activeRestaurantId, user]);


  const handleLogout = () => {
    try {
      sessionStorage.removeItem('loggedInRestaurant');
      sessionStorage.removeItem('loggedInUser');
      sessionStorage.removeItem('activeRestaurantId');
    } catch(e) {
      console.error("No se pudo limpiar sessionStorage:", e);
    }
    router.replace('/');
  };
  
  const handleRestaurantChange = (newId: string) => {
    if (!newId || newId === activeRestaurantId) return;
    setActiveRestaurantId(newId);
    sessionStorage.setItem('activeRestaurantId', newId);
    window.location.reload();
  };

  const menuItems = useMemo(() => {
    if (!user) return [];

    const allItems = [
      { href: '/dashboard', label: 'Informes', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'seller'] },
      { href: '/dashboard/comidas', label: 'Comanda', icon: ShoppingBasket, roles: ['superadmin', 'admin', 'seller', 'waiter'] },
      { href: '/dashboard/historial-ventas', label: 'Historial', icon: History, roles: ['superadmin', 'admin', 'seller', 'waiter'] },
      { href: '/dashboard/menu', label: 'Menú', icon: BookMarked, roles: ['superadmin', 'admin', 'seller', 'waiter'] },
      { href: '/dashboard/categorias', label: 'Categorías', icon: Tag, roles: ['superadmin', 'admin'] },
      { href: '/dashboard/stock', label: 'Stock', icon: Package, roles: ['superadmin', 'admin', 'seller'] },
      { href: '/dashboard/compras', label: 'Compras', icon: ShoppingCart, roles: ['superadmin', 'admin', 'seller'] },
      { href: '/dashboard/clientes', label: 'Clientes', icon: Users, roles: ['superadmin', 'admin', 'seller'] },
      { href: '/dashboard/usuarios', label: 'Usuarios', icon: UsersRound, roles: ['superadmin', 'admin'] },
      { href: '/dashboard/superadmin', label: 'Super Admin', icon: ShieldAlert, roles: ['superadmin'] },
    ];
    
    return allItems.filter(item => item.roles.includes(user.role));
  }, [user]);

  const NavLinks = ({isMobile = false} : {isMobile?: boolean}) => (
    <>
      {menuItems.map((item) => (
         <Button asChild key={item.href} variant={pathname === item.href ? "secondary" : "ghost"} size="sm" className={cn(
            isMobile ? "w-full justify-start text-base gap-4 p-4 h-auto" : "h-9",
            item.href === '/dashboard/superadmin' && (pathname.startsWith(item.href) ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'text-destructive/80 hover:bg-destructive/10 hover:text-destructive'),
          )}
          onClick={() => isMobile && setIsSheetOpen(false)}
          >
          <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Link>
        </Button>
      ))}
    </>
  );

  if (!isHydrated) {
    return <DashboardSkeleton />;
  }

  return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <header className="sticky top-0 z-30 border-b bg-card">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
              <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                  <UtensilsCrossed className="h-6 w-6 text-primary" />
                  <span className="hidden text-lg sm:inline-block">{currentRestaurant ? currentRestaurant.name : <Skeleton className="h-6 w-32" />}</span>
              </Link>

              <div className="flex items-center gap-2">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle navigation menu</span>
                      </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="flex flex-col p-0">
                      <div className="p-4 border-b">
                          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-xl" onClick={() => setIsSheetOpen(false)}>
                            <UtensilsCrossed className="h-7 w-7 text-primary" />
                            <span>{currentRestaurant ? currentRestaurant.name : <Skeleton className="h-7 w-36" />}</span>
                          </Link>
                      </div>
                      <nav className="grid gap-2 text-lg font-medium p-4">
                        <NavLinks isMobile />
                      </nav>
                  </SheetContent>
                </Sheet>
                
                <InstallPwaButton />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="size-9">
                        <AvatarFallback>{user ? (user.name || user.email).charAt(0).toUpperCase() : '?'}</AvatarFallback>
                      </Avatar>
                      <span className="sr-only">Toggle user menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name || user?.email}</p>
                        <p className="text-xs leading-none text-muted-foreground capitalize">{user?.role}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
          </div>
          
          <nav className="hidden border-t bg-card/95 px-4 md:flex md:items-center md:justify-between md:px-6">
              <div className="flex flex-wrap items-center gap-2 py-2">
                  <NavLinks />
              </div>
               {user?.role === 'superadmin' && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="restaurant-select" className="text-sm font-medium">
                    Viendo:
                  </Label>
                  <Select
                    value={activeRestaurantId ?? ''}
                    onValueChange={handleRestaurantChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="restaurant-select" className="w-[220px] h-9">
                      <SelectValue placeholder="Selecciona un restaurante" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Restaurantes</SelectItem>
                      {allRestaurants.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
          </nav>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
  );
}
