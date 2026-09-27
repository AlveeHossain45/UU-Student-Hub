import { useEffect, useState } from "react";

/** Returns the current Date, re-rendering every `interval` ms. Used for live countdowns. */
export default function useNow(interval = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}
