"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { Home, Users, Tag, User, Menu, X, LogOut, UserPlus, Info } from "lucide-react";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/lib/actions";

type MobileBottomNavProps = {
  role?: "USER" | "COACH" | "ADMIN" | null;
};

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  const espaceClientHref =
    role === "ADMIN" ? "/admin" :
    role === "COACH" ? "/coach-studio" :
    role === "USER" ? "/tableau-de-bord" :
    "/connexion";

  const bottomItems = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/coachs", label: "Coachs", icon: Users },
    { href: "/offres", label: "Tarifs", icon: Tag },
    { href: espaceClientHref, label: "Espace client", icon: User },
  ];

  return (
    <>
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/96 md:hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <span className="text-xs font-black uppercase tracking-widest text-white">Menu</span>
            <button onClick={() => setMenuOpen(false)} className="text-white">
              <X size={22} />
            </button>
          </div>
          <nav className="flex flex-col gap-1 p-4">
            <Link href="/inscription?role=COACH" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-200 hover:bg-white/10">
              <UserPlus size={18} /> Candidature coach
            </Link>
            <Link href="/#a-propos" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-200 hover:bg-white/10">
              <Info size={18} /> À propos
            </Link>
            {!role && (
              <>
                <Link href="/connexion" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-200 hover:bg-white/10">
                  <User size={18} /> Connexion
                </Link>
                <Link href="/inscription" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-200 hover:bg-white/10">
                  <User size={18} /> S'inscrire
                </Link>
              </>
            )}
            {role && (
              <button
                type="button"
                onClick={() => { setMenuOpen(false); startTransition(async () => logoutAction()); }}
                disabled={isPending}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-widest text-red-400 hover:bg-white/10"
              >
                <LogOut size={18} /> {isPending ? "Déconnexion..." : "Se déconnecter"}
              </button>
            )}
          </nav>
        </div>
      )}

      <div className="mobile-nav-shell md:hidden">
        <nav className="mobile-nav-inner">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && item.href !== "/connexion" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav-item ${isActive ? "mobile-nav-item-active" : ""}`}
              >
                <Icon size={18} strokeWidth={2.2} />
                <span className="mobile-nav-label">{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            className="mobile-nav-item"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={18} strokeWidth={2.2} />
            <span className="mobile-nav-label">Menu</span>
          </button>
        </nav>
      </div>
    </>
  );
}