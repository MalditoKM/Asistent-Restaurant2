
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton = () => (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-6 w-32 hidden sm:block" />
            </div>
            <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 md:hidden" />
                <Skeleton className="h-9 w-9 rounded-full" />
            </div>
        </header>
        <main className="p-4 sm:p-6">
            <div className="space-y-6">
                <Skeleton className="h-96 w-full" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </main>
    </div>
);

    