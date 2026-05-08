"use client";

import Link from "next/link";
import { Home, Users, Tag, User } from "lucide-react";
import { usePathname } from "next/navigation";

type MobileBottomNavProps = {
  role?: "USER" | "COACH" | "ADMIN" | null;
};

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();

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
      </nav>
    </div>
  );
}