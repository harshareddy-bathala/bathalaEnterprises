import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-wide flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="rounded-full bg-gradient-to-br from-royal/10 to-purple/10 p-8 mb-6">
        <Search className="h-16 w-16 text-royal" />
      </div>
      <h1 className="text-5xl font-black text-slate-900 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-slate-700 mb-4">Page Not Found</h2>
      <p className="text-slateInk mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved. 
        Let's get you back on track.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Button asChild size="lg">
          <Link href="/" className="gap-2">
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </Button>
        <Button variant="secondary" asChild size="lg">
          <Link href="/all-properties" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            View Properties
          </Link>
        </Button>
      </div>
    </div>
  );
}
