// components/system/GlobalLoader.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { subscribe } from "@/lib/globalLoading";

const LottiePlayer = dynamic<any>(
  () => import("@lottiefiles/react-lottie-player").then(m => m.Player),
  { ssr: false }
);

export default function GlobalLoader() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsub = subscribe(setActive);
    return () => unsub();
  }, []);

  useEffect(() => {
    let t: any;
    if (active > 0) t = setTimeout(() => setVisible(true), 120);
    else setVisible(false);
    return () => t && clearTimeout(t);
  }, [active]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <LottiePlayer
        src="/animations/loader.json"
        autoplay
        loop
        style={{ width: "220px", height: "220px" }}
      />
    </div>
  );
}
