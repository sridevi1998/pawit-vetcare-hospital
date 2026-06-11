import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getCurrentUser, setServerAuthToken } from "@/lib/pawit-api";
import { defaultSectionForRole } from "@/lib/role-access";

export default async function HospitalHomePage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("pawit_access")?.value ?? "";
  if (!authCookie) {
    redirect("/login");
  }
  setServerAuthToken(authCookie);
  const currentUser = await getCurrentUser();
  redirect(`/hospital/${defaultSectionForRole(currentUser.user.role)}`);
}
