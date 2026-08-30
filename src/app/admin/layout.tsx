import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { SessionProvider } from "@/components/admin/SessionProvider";

export const metadata: Metadata = {
  title: "Console",
  // The control room is not content. It is excluded in robots.txt as well,
  // which is what actually keeps it out of an index.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}
