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
    <div className="min-h-screen bg-[#f8f7f2] text-[#101010]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">

      {/* Header */}
      <section className="mb-8">
        <p className="accent-text-shadow text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Catalogue coachs</p>
        <h1 className="mt-3 text-[2.2rem] font-black uppercase tracking-[-0.04em] text-[#101010] md:text-[3rem]">
          Trouve ton coach
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-black/56 md:text-[15px]">
          {coaches.length} coach{coaches.length > 1 ? "s" : ""} disponible{coaches.length > 1 ? "s" : ""}&nbsp;&mdash;&nbsp;{formatPrice(PLATFORM_MONTHLY_PRICE)}&nbsp;/ mois, annulable à tout moment.
        </p>
      </section>

      {/* Filters */}
      <section className="mb-8 rounded-[24px] border border-black/10 bg-white p-4 shadow-[0_18px_40px_rgba(0,0,0,0.06)] sm:p-5">
        <form action="/coachs" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] xl:items-center">
          <input
            type="search"
            name="q"
            placeholder="Nom, discipline, spécialité…"
            defaultValue={search}
            className="min-h-[50px] w-full rounded-[14px] border border-black/12 bg-[#f3f1e8] px-4 text-sm font-medium text-[#101010] outline-none transition focus:border-[#9fba32] focus:bg-white"
          />
          <select name="discipline" defaultValue={discipline} className="min-h-[50px] w-full rounded-[14px] border border-black/12 bg-[#f3f1e8] px-4 text-sm font-medium text-[#101010] outline-none transition focus:border-[#9fba32] focus:bg-white">
            <option value="">Toutes les disciplines</option>
            {disciplines.map((item: string) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select name="speciality" defaultValue={speciality} className="min-h-[50px] w-full rounded-[14px] border border-black/12 bg-[#f3f1e8] px-4 text-sm font-medium text-[#101010] outline-none transition focus:border-[#9fba32] focus:bg-white">
            <option value="">Toutes les spécialités</option>
            {specialities.map((item: string) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select name="sort" defaultValue={sort} className="min-h-[50px] w-full rounded-[14px] border border-black/12 bg-[#f3f1e8] px-4 text-sm font-medium text-[#101010] outline-none transition focus:border-[#9fba32] focus:bg-white">
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
              className="flex min-h-[50px] items-center justify-center rounded-full border border-black/12 px-4 text-xs font-bold uppercase tracking-[0.14em] text-black/68 transition hover:border-black/20 hover:bg-black/[0.02] hover:text-black"
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
                !discipline ? "bg-[var(--accent)] text-black" : "border border-black/10 bg-white text-black/55 hover:border-black/20 hover:text-black/82"
              }`}
            >
              Tout
            </Link>
            {disciplines.map((item: string) => (
              <Link
                key={item}
                href={`/coachs?discipline=${encodeURIComponent(item)}${search ? `&q=${encodeURIComponent(search)}` : ""}${sort !== "popular" ? `&sort=${encodeURIComponent(sort)}` : ""}`}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                  discipline === item ? "bg-[var(--accent)] text-black" : "border border-black/10 bg-white text-black/55 hover:border-black/20 hover:text-black/82"
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
            {coaches.map((coach: (typeof coaches)[number], index: number) => (
              <Link
                key={coach.id}
                href={`/coach/${coach.slug}`}
                className="group relative flex min-h-[340px] flex-col overflow-hidden rounded-[24px] border border-white/8 bg-[rgba(17,17,17,0.9)] shadow-[0_18px_38px_rgba(0,0,0,0.16)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_46px_rgba(0,0,0,0.22)]"
              >
                <div className="relative h-[208px] overflow-hidden bg-[#111111]">
                  {coach.photoUrl ? (
                    <Image
                      src={coach.photoUrl}
                      alt={coach.displayName}
                      fill
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#232323]">
                      <span className="select-none text-4xl font-black uppercase text-white/12">
                        {coach.displayName.slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.18)] via-transparent to-transparent" />
                </div>

                <div className="absolute left-4 top-4 flex items-center gap-2">
                  {index === 0 ? (
                    <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-black">
                      Nouveau
                    </span>
                  ) : null}
                </div>

                <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/22 bg-black/24 text-white/92 backdrop-blur-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                    <path d="m12 21-1.45-1.32C5.4 15.04 2 11.95 2 8.15 2 5.06 4.42 2.5 7.5 2.5c1.74 0 3.41.81 4.5 2.09A6.02 6.02 0 0 1 16.5 2.5C19.58 2.5 22 5.06 22 8.15c0 3.8-3.4 6.89-8.55 11.54Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="relative z-10 flex flex-1 flex-col border-t border-white/8 bg-[linear-gradient(180deg,rgba(18,18,18,0.96),rgba(9,9,9,0.98))] p-4 text-white">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-[1.08rem] font-black tracking-[-0.03em] text-white">{coach.displayName}</h2>
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-black text-black">✓</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[var(--accent)]">{coach.discipline}</p>
                    </div>
                  </div>

                  <p className="mt-2.5 line-clamp-2 min-h-[2.6rem] text-[13px] leading-5 text-white/80">{coach.headline}</p>

                  <div className="mt-auto border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between gap-3 text-[12px] font-semibold text-white/92">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5 text-white/78">
                          <path d="M4 6h16M8 3v6M16 3v6M5 10h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {coach.experienceYears} ans
                      </span>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5 text-white/78">
                          <path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M18 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 10v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {coach._count.programs} programme{coach._count.programs > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="light-panel rounded-[24px] p-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Aucun résultat</p>
            <h2 className="mt-4 text-2xl font-black uppercase tracking-tighter text-[#101010]">
              Aucun coach ne correspond
            </h2>
            <p className="mt-3 text-sm text-black/52">
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
    </div>
  );
}
