"use client";
import Link from 'next/link';
import { useState } from 'react';

// Navbar sticky bersih ala Cihuynime — tanpa link iklan / eksternal berbayar.
const Navbar = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navLinks = [
    { href: "/", name: "Home" },
    { href: "/ongoing", name: "Ongoing" },
    { href: "/completed", name: "Completed" },
    { href: "/animelist", name: "Anime List" },
    { href: "/genre", name: "Genre" },
    { href: "/schedule", name: "Jadwal" },
    { href: "/movie", name: "Movie" },
    { href: "/populer", name: "Populer" },
  ];
  if (user) navLinks.push({ href: "/users/dashboard", name: "Dashboard" });
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#07070d]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-black tracking-tight text-white">
          Juju<span className="text-fuchsia-500">Otaku</span>
          <span className="ml-2 hidden rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-neutral-400 sm:inline">NO ADS</span>
        </Link>
        <nav className="hidden items-center gap-5 lg:flex">
          {navLinks.map((l) => (<Link key={l.href} href={l.href} className="text-sm font-medium text-neutral-300 transition hover:text-fuchsia-400">{l.name}</Link>))}
        </nav>
        <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu" className="text-white lg:hidden">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} /></svg>
        </button>
      </div>
      {isOpen && (
        <nav className="border-t border-white/5 px-4 py-3 lg:hidden">
          {navLinks.map((l) => (<Link key={l.href} href={l.href} onClick={() => setIsOpen(false)} className="block rounded-lg px-2 py-2.5 text-neutral-200 hover:bg-white/5">{l.name}</Link>))}
        </nav>
      )}
    </header>
  );
}
export default Navbar;
