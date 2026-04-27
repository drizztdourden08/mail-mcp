import { useState, useEffect, useRef } from "react";

export function useCountdown(expiresIn: number | undefined) {
  const [remaining, setRemaining] = useState<number | null>(expiresIn ?? null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!expiresIn) return;
    startRef.current = Date.now();
    setRemaining(expiresIn);
    const iv = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const left = expiresIn - elapsed;
      setRemaining(left > 0 ? left : 0);
      if (left <= 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [expiresIn]);

  return remaining;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
