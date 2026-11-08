"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CartRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/store/cart");
  }, [router]);

  return null;
}
