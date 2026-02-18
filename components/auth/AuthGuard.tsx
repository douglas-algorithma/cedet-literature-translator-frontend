"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Spinner } from "@/components/common/Spinner";
import { getToken } from "@/services/authService";

const PUBLIC_PATHS = ["/login"];

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  const isPublic = pathname && PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isPublic) {
      setAllowed(true);
      return;
    }
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setAllowed(true);
  }, [router, isPublic]);

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-brand" />
      </div>
    );
  }

  return <>{children}</>;
}
