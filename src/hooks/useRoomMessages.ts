import { useEffect, useState } from "react";
import { listMessages, type Message } from "@/lib/api";

const POLL_INTERVAL_MS = 2000;

export function useRoomMessages(address: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let after = 0;
    let timer = 0;

    setMessages([]);
    setError(null);

    async function poll() {
      try {
        const page = await listMessages(address, after);
        if (cancelled) return;
        if (page.messages.length > 0) {
          setMessages((previous) => [...previous, ...page.messages]);
        }
        after = page.nextAfter;
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load messages.");
      }
      if (!cancelled) timer = window.setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [address]);

  return { messages, error };
}
