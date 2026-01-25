"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FontLike {
  className: string;
}

type NavbarProps = {
  brandFont: FontLike;
  scriptFont: FontLike;
};

const links = [
  { href: "/", label: "Home" },
  { href: "#services", label: "Services" },
  { href: "/all-properties", label: "Properties" },
  { href: "#contact", label: "Contact" }
];

export default function Navbar({ brandFont, scriptFont }: NavbarProps) {
  const [open, setOpen] = useState(false);

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="container-wide">
        <div className="glass-panel mt-4 flex items-center justify-between rounded-2xl px-4 py-3 shadow-glass">
          <Link href="/" className="flex items-center gap-2" onClick={handleLinkClick}>
            <div className="flex flex-col leading-tight">
              <span className={cn("text-xl uppercase tracking-wide text-royal", brandFont.className)}>Bathala</span>
              <span className={cn("-mt-1 text-base text-slateInk", scriptFont.className)}>Enterprises</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {links.map((link) => {
              const isExternalLink = link.href.startsWith("#");
              const Component = isExternalLink ? "a" : Link;
              return (
                <Component
                  key={link.href}
                  href={link.href}
                  className="text-sm font-semibold text-slate-700 hover:text-royal transition-colors"
                >
                  {link.label}
                </Component>
              );
            })}
            <a
              href="#contact"
              className="rounded-full bg-amberGlow px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-amberGlow/30 hover:bg-amber-400 transition-colors"
            >
              Get in touch
            </a>
          </nav>

          <button
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-white/60 md:hidden"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="glass-panel mt-2 flex flex-col gap-2 rounded-2xl px-4 py-3 md:hidden">
            {links.map((link) => {
              const isExternalLink = link.href.startsWith("#");
              const Component = isExternalLink ? "a" : Link;
              return (
                <Component
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white/70"
                  onClick={handleLinkClick}
                >
                  {link.label}
                </Component>
              );
            })}
            <a
              href="#contact"
              className="block rounded-lg bg-amberGlow px-3 py-2 text-center text-sm font-semibold text-slate-900 hover:bg-amber-400"
              onClick={handleLinkClick}
            >
              Get in touch
            </a>
          </div>
        )}
      </div>
    </header>
  );
}