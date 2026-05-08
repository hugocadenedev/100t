"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X, LogOut, UserPlus, Info, User } from "lucide-react";
import { logoutAction } from "@/lib/actions";

type MobileHamburgerProps = {
  role?: "USER" | "COACH" | "ADMIN" | null;
};

export function MobileHamburger({ role }: MobileHamburgerProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const overlay = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: '#000000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px' }}>
        <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'white' }}>Menu</span>
        <button onClick={() => setOpen(false)} style={{ color: 'white', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={22} />
        </button>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px' }}>
        <Link href="/inscription?role=COACH" onClick={() => setOpen(false)}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e2e8f0', textDecoration: 'none' }}>
          <UserPlus size={18} /> Candidature coach
        </Link>
        <Link href="/#a-propos" onClick={() => setOpen(false)}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e2e8f0', textDecoration: 'none' }}>
          <Info size={18} /> À propos
        </Link>
        {!role && (
          <>
            <Link href="/connexion" onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e2e8f0', textDecoration: 'none' }}>
              <User size={18} /> Connexion
            </Link>
            <Link href="/inscription" onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e2e8f0', textDecoration: 'none' }}>
              <User size={18} /> S'inscrire
            </Link>
          </>
        )}
        {role && (
          <button type="button"
            onClick={() => { setOpen(false); startTransition(async () => logoutAction()); }}
            disabled={isPending}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut size={18} /> {isPending ? "Déconnexion..." : "Se déconnecter"}
          </button>
        )}
      </nav>
    </div>
  );

  return (
    <>
      <button
        type="button"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Menu"
      >
        <Menu size={22} strokeWidth={2.2} />
      </button>

      {mounted && open && createPortal(overlay, document.body)}
    </>
  );
}
