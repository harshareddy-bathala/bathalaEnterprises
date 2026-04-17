import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SiteNotFound() {
	return (
		<div className="bathala-page flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
			<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f6f1e5]">
				<span className="material-symbols-outlined text-4xl text-primary">search_off</span>
			</div>
			<h1 className="mb-2 font-display text-5xl font-semibold text-[#1a1f2e]">404</h1>
			<h2 className="mb-4 font-display text-2xl font-semibold text-[#2c3340]">Page Not Found</h2>
			<p className="mb-8 max-w-md text-[#6b7280]">
				The page you&apos;re looking for doesn&apos;t exist or has been moved.
			</p>
			<div className="flex flex-wrap justify-center gap-4">
				<Button asChild size="lg">
					<Link href="/">Go Home</Link>
				</Button>
				<Button variant="secondary" asChild size="lg">
					<Link href="/all-properties">View Properties</Link>
				</Button>
			</div>
		</div>
	);
}
