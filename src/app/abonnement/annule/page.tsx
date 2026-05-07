import Link from "next/link";

export const metadata = { title: "Paiement annulé — 100T" };

export default async function AbonnementAnnulePage({
  searchParams,
}: {
  searchParams: Promise<{ coach?: string }>;
}) {
  const { coach } = await searchParams;
  const backHref = coach ? `/coach/${coach}` : "/coachs";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/8 text-4xl">
          ✕
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">
          Paiement annulé
        </h1>
        <p className="text-sm leading-7 text-white/62">
          Ton paiement a été annulé. Aucun montant n'a été débité. Tu peux réessayer à tout moment.
        </p>
        <Link
          href={backHref}
          className="app-button-accent inline-block px-8 py-3 text-sm font-bold uppercase tracking-wider"
        >
          Retourner au profil
        </Link>
      </div>
    </main>
  );
}
