import Image from "next/image";
import Link from "next/link";

import { getMarketplaceData } from "@/lib/data";
import { PLATFORM_MONTHLY_PRICE } from "@/lib/domain";
import { formatPrice } from "@/lib/utils";

const sortOptions = [
  { value: "popular", label: "Les plus demandés" },
  { value: "newest", label: "Les plus récents" },
] as const;

export default async function CoachsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; discipline?: string; speciality?: string; price?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() || "";
  const discipline = params.discipline?.trim() || "";
  const speciality = params.speciality?.trim() || "";
  const price = params.price?.trim() || "all";
  const sort = params.sort?.trim() || "popular";
  const { coaches, disciplines, specialities } = await getMarketplaceData(
    search,
    discipline,
    speciality,
    price as "all" | "under-30" | "30-45" | "45-plus",
    sort as "popular" | "price-asc" | "price-desc" | "newest",
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      {/* Header */}
      <section className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Catalogue coachs</p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tighter text-white md:text-4xl">
          Trouve ton coach
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/52">
          {coaches.length} coach{coaches.length > 1 ? "s" : ""} disponible{coaches.length > 1 ? "s" : ""}&nbsp;&mdash;&nbsp;{formatPrice(PLATFORM_MONTHLY_PRICE)}&nbsp;/ mois, annulable à tout moment.
        </p>
      </section>

      {/* Filters */}
      <section className="mb-8 rounded-[20px] border border-white/6 bg-white/[0.025] p-4 backdrop-blur-xl">
        <form action="/coachs" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <input
            type="search"
            name="q"
            placeholder="Nom, discipline, spécialité…"
            defaultValue={search}
            className="field text-sm"
          />
          <select name="discipline" defaultValue={discipline} className="field text-sm">
            <option value="">Toutes les disciplines</option>
            {disciplines.map((item: string) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select name="speciality" defaultValue={speciality} className="field text-sm">
            <option value="">Toutes les spécialités</option>
            {specialities.map((item: string) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select name="sort" defaultValue={sort} className="field text-sm">
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="app-button-accent min-h-[48px] px-6 text-xs font-bold uppercase tracking-[0.14em]"
          >
            Filtrer
          </button>
          {(search || discipline || speciality || sort !== "popular") ? (
            <Link
              href="/coachs"
              className="flex min-h-[48px] items-center rounded-full border border-white/10 px-4 text-xs text-white/60 transition hover:border-white/20 hover:text-white"
            >
              Réinitialiser
            </Link>
          ) : null}
        </form>

        {disciplines.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/coachs"
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                !discipline ? "bg-[var(--accent)] text-black" : "border border-white/8 text-white/52 hover:border-white/16 hover:text-white/80"
              }`}
            >
              Tout
            </Link>
            {disciplines.map((item: string) => (
              <Link
                key={item}
                href={`/coachs?discipline=${encodeURIComponent(item)}${search ? `&q=${encodeURIComponent(search)}` : ""}${sort !== "popular" ? `&sort=${encodeURIComponent(sort)}` : ""}`}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                  discipline === item ? "bg-[var(--accent)] text-black" : "border border-white/8 text-white/52 hover:border-white/16 hover:text-white/80"
                }`}
              >
                {item}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {/* Grid */}
      <section>
        {coaches.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {coaches.map((coach: (typeof coaches)[number]) => (
              <Link
                key={coach.id}
                href={`/coach/${coach.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-[24px] border border-white/6 bg-white/[0.025] shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/12 hover:shadow-[0_16px_48px_rgba(0,0,0,0.28)]"
              >
                {/* Photo */}
                <div className="relative h-52 overflow-hidden">
                  {coach.photoUrl ? (
                    <Image
                      src={coach.photoUrl}
                      alt={coach.displayName}
                      fill
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[rgba(255,255,255,0.06)]">
                      <span className="select-none text-3xl font-black uppercase text-white/10">
                        {coach.displayName.slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,9,14,0.88)] via-[rgba(6,9,14,0.18)] to-transparent" />
                  {/* Discipline badge */}
                  <div className="absolute left-3 top-3">
                    <span className="rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)] backdrop-blur-md">
                      {coach.discipline}
                    </span>
                  </div>
                  {/* Price badge */}
                  <div className="absolute right-3 top-3">
                    <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-black text-black">
                      {formatPrice(PLATFORM_MONTHLY_PRICE)} / mois
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <h2 className="text-base font-bold text-white">{coach.displayName}</h2>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/52">{coach.headline}</p>
                  </div>

                  {/* Specs */}
                  <div className="flex gap-4 text-xs">
                    <div>
                      <div className="font-bold text-white">{coach._count.subscriptions}</div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-white/36">abonnés</div>
                    </div>
                    <div>
                      <div className="font-bold text-white">{coach._count.programs}</div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-white/36">programmes</div>
                    </div>
                    <div>
                      <div className="font-bold text-white">{coach.experienceYears}&nbsp;ans</div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-white/36">expérience</div>
                    </div>
                  </div>

                  {/* Tags */}
                  {coach.specialities ? (
                    <div className="flex flex-wrap gap-1.5">
                      {coach.specialities
                        .split(",")
                        .map((s: string) => s.trim())
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/8 px-2 py-0.5 text-[10px] text-white/50"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  ) : null}

                  {/* CTA */}
                  <div className="mt-auto pt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] transition group-hover:gap-2.5">
                      Voir le profil
                      <span className="text-[10px] transition-transform group-hover:translate-x-0.5">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-white/5 bg-white/[0.008] p-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Aucun résultat</p>
            <h2 className="mt-4 text-2xl font-black uppercase tracking-tighter text-white">
              Aucun coach ne correspond
            </h2>
            <p className="mt-3 text-sm text-white/48">
              Essaie une autre discipline ou élargis la recherche.
            </p>
            <Link
              href="/coachs"
              className="app-button-accent mt-6 inline-flex px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em]"
            >
              Réinitialiser
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
