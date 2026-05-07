import { redirect } from "next/navigation";

import { AdminBackoffice } from "@/components/admin-backoffice";
import { getCurrentUser } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/data";
import { Role } from "@/lib/domain";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  if (user.role !== Role.ADMIN) {
    redirect("/");
  }

  const data = await getAdminDashboardData();

  return <AdminBackoffice data={data} />;
}
