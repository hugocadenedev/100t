import Image from "next/image";
import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { fullName } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

export async function TopNav() {
  const user = await getCurrentUser();
  const accountHref = user?.role === "ADMIN" ? "/admin" : user?.role === "COACH" ? "/coach-studio" : "/tableau-de-bord";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/8 bg-[rgba(0,0,0,0.86)] backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3 md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <Image src="/logo100t.png" alt="100T" width={116} height={34} className="h-8 w-auto md:h-9" priority />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/coachs" className="text-xs font-bold uppercase tracking-widest text-slate-100 transition-colors hover:text-[var(--accent)]">
              Trouver un coach
            </Link>
            <Link href="/offres" className="text-xs font-bold uppercase tracking-widest text-slate-100 transition-colors hover:text-[var(--accent)]">
              Offres
            </Link>
            <Link href="/inscription?role=COACH" className="text-xs font-bold uppercase tracking-widest text-slate-100 transition-colors hover:text-[var(--accent)]">
              Candidature coach
            </Link>
            <Link href="/#a-propos" className="text-xs font-bold uppercase tracking-widest text-slate-100 transition-colors hover:text-[var(--accent)]">
              A Propos
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <form action="/coachs" className="hidden items-center md:flex">
            <input
              type="search"
              name="q"
              placeholder="Rechercher"
              className="w-32 border-b border-transparent bg-transparent px-0 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-100 outline-none placeholder:text-slate-500 focus:border-[var(--accent)]"
            />
          </form>
          {user ? (
            <>
              <Link
                href={accountHref}
                className="app-button-ghost hidden px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-100 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] md:inline-flex"
              >
                {user.role === "ADMIN" ? "Administration" : fullName(user.firstName, user.lastName)}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                className="app-button-ghost hidden px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-100 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] md:inline-flex"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="app-button-accent px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-colors hover:bg-white"
              >
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
