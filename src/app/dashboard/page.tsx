import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

export default async function DashboardRedirectPage() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin");
    case "STAFF":
      redirect("/staff");
    default:
      redirect("/customer");
  }
}
