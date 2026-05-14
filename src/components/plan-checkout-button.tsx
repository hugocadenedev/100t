"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface PlanCheckoutButtonProps {
  plan: string;
  children: React.ReactNode;
  className?: string;
  isAuthenticated: boolean;
}

export default function PlanCheckoutButton({
  plan,
  children,
  className,
  isAuthenticated,
}: PlanCheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!isAuthenticated) {
      router.push("/inscription?redirectAfter=%2Foffres");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? "Redirection…" : children}
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
