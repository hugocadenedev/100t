import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center sm:px-6 lg:px-8">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">404</p>
      <h1 className="text-4xl font-semibold text-white">Contenu introuvable</h1>
      <p className="max-w-xl text-white/62">
        La page demandée n'existe pas ou le contenu n'est pas accessible avec ton niveau d'autorisation.
      </p>
      <Link
        href="/"
        className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-foreground)]"
      >
        Revenir à l'accueil
      </Link>
    </div>
  );
}
