
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Restaurant, User } from '@/types';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { getAllRestaurantsWithUsers, createRestaurant } from '@/lib/server/actions';

const loginSchema = z.object({
  email: z.string().email('Por favor, introduce una dirección de correo electrónico válida.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;


export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    try {
        // --- SUPERADMIN RECOVERY LOGIC ---
        if (data.email === 'superadmin@example.com' && data.password === 'password123') {
            let allRestaurants = await getAllRestaurantsWithUsers();
            
            let superAdminUser: User | null = null;
            for (const restaurant of allRestaurants) {
                const found = restaurant.users.find(u => u.role === 'superadmin');
                if (found) {
                    superAdminUser = found;
                    break;
                }
            }
            
            // If no superadmin exists in the DB, create one. This is a failsafe.
            if (!superAdminUser) {
                const newRestaurant = await createRestaurant(
                    { name: 'Sede Principal (Default)', address: 'Sistema', phone: '000' },
                    { name: 'Super Admin', email: data.email, password: data.password }
                );
                superAdminUser = newRestaurant.users.find(u => u.role === 'superadmin')!;
                 toast({
                    title: 'Superadmin Creado',
                    description: `Se ha creado el usuario superadmin por defecto.`,
                });
            }
            
            toast({
                title: 'Acceso de Recuperación',
                description: `Has iniciado sesión como Superadmin.`,
            });
            sessionStorage.setItem('loggedInUser', JSON.stringify(superAdminUser));
            sessionStorage.setItem('activeRestaurantId', 'all');
            sessionStorage.setItem('loggedInRestaurant', superAdminUser.restaurantId);
            router.push('/dashboard');
            return; 
        }

        // --- REGULAR USER LOGIN ---
        const allRestaurants = await getAllRestaurantsWithUsers();
        
        let loggedInUser: User | null = null;
        let restaurantForUser: Restaurant | null = null;

        for (const restaurant of allRestaurants) {
            const foundUser = restaurant.users.find(u => u.email === data.email);
            if (foundUser) {
                if (foundUser.password === data.password) {
                    loggedInUser = foundUser;
                    restaurantForUser = restaurant;
                    break; 
                }
            }
        }

        if (loggedInUser && restaurantForUser) {
            toast({
                title: 'Inicio de Sesión Exitoso',
                description: `¡Bienvenido de nuevo, ${loggedInUser.name || loggedInUser.email}!`,
            });

            sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
            
            const restaurantIdToSet = loggedInUser.role === 'superadmin' ? 'all' : restaurantForUser.id;
            sessionStorage.setItem('activeRestaurantId', restaurantIdToSet);
            sessionStorage.setItem('loggedInRestaurant', restaurantForUser.id);

            router.push('/dashboard');
        } else {
            toast({
                variant: 'destructive',
                title: 'Fallo de Inicio de Sesión',
                description: 'Email o contraseña no válidos. Por favor, inténtalo de nuevo.',
            });
        }
    } catch (error: any) {
        console.error("Error en el inicio de sesión:", error);
        toast({
            variant: 'destructive',
            title: 'Error del Servidor',
            description: error.message || 'No se pudo conectar a la base de datos. Por favor, inténtalo de nuevo más tarde.',
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email del Usuario</FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input type="email" placeholder="usuario@ejemplo.com" {...field} className="pl-10" />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                 <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} className="pl-10 pr-10" />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</span>
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
        </Button>
      </form>
    </Form>
  );
}
