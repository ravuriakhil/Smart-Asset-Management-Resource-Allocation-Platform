"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
      <div className="skeleton" style={{ width: "240px", height: "40px", borderRadius: "8px" }}></div>
    </div>
  );
}
