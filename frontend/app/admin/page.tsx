import type { Metadata } from "next";
import { RequireAuth } from "@/components/system/RequireAuth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = { title: "Admin · Clardentity" };

/* The server decides who may see this, not the route: RequireAuth only gets
   you signed in, and /admin/overview returns 404 to anyone outside the
   configured admin list. A page that hid itself in the client would still be
   one fetch away from the data. */
export default function AdminPage() {
  return (
    <RequireAuth>
      <AdminDashboard />
    </RequireAuth>
  );
}
