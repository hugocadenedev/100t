"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Home, LayoutDashboard, LogOut, Shield, Users } from "lucide-react";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/lib/actions";

type MobileBottomNavProps = {
  role?: "USER" | "COACH" | "ADMIN" | null;
};

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const accountItem =
    role === "ADMIN"
      ? { href: "/admin", label: "Admin", icon: Shield }
      : role === "COACH"
        ? { href: "/coach-studio", label: "Studio", icon: LayoutDashboard }
        : role === "USER"
          ? { href: "/tableau-de-bord", label: "Compte", icon: LayoutDashboard }
          : { href: "/connexion", label: "Compte", icon: LayoutDashboard };

  const normalizedItems = role
    ? [
        { href: "/", label: "Accueil", icon: Home },
        { href: "/coachs", label: "Coachs", icon: Users },
        accountItem,
        { href: "#logout", label: isPending ? "Sortie..." : "Sortie", icon: LogOut },
      ]
    : [
        { href: "/", label: "Accueil", icon: Home },
        { href: "/coachs", label: "Coachs", icon: Users },
        { href: "/connexion", label: "Entrer", icon: LayoutDashboard },
        { href: "/inscription", label: "Creer", icon: Shield },
      ];

  return (
    <div className="mobile-nav-shell md:hidden">
      <nav className="mobile-nav-inner">
        {normalizedItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          if (item.href === "#logout") {
            return (
              <button
                key={item.label}
                type="button"
                className="mobile-nav-item"
                onClick={() => startTransition(async () => logoutAction())}
                disabled={isPending}
              >
                <Icon size={18} strokeWidth={2.2} />
                <span className="mobile-nav-label">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={`${item.href}-${item.label}`}
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