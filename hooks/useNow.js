import { useEffect, useState } from "react";

// null di render pertama supaya server & browser menghasilkan HTML yang sama
export function useNow(interval = 60000) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), interval);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [interval]);
  return now;
}