// frontend/lib/autosave.ts
type Opts = {
  getText: () => string;              // как получить текущий текст
  meta?: Record<string, any>;
  token: string;                      // AUTH_TOKEN
  url?: string;                       // по умолчанию /autosave
  userId?: string;                    // "boris" по умолчанию на бэке
  intervalMs?: number;                // 60_000
  idleMs?: number;                    // 3000
  minDelta?: number;                  // 200  (минимум новых символов)
};

export function startAutosave(opts: Opts) {
  const url = opts.url ?? "/autosave";
  const intervalMs = opts.intervalMs ?? 60_000;
  const idleMs = opts.idleMs ?? 3000;
  const minDelta = opts.minDelta ?? 200;

  let lastSaved = "";
  let tIdle: any;
  let tInterval: any;
  let inFlight = false;
  let abort: AbortController | null = null;

  async function save(reason: string) {
    const text = opts.getText();
    if (inFlight) return;
    if (text.length - lastSaved.length < minDelta && text === lastSaved) return;

    inFlight = true;
    abort?.abort();
    abort = new AbortController();
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${opts.token}`,
        },
        body: JSON.stringify({ text, meta: { ...opts.meta, reason } }),
        signal: abort.signal,
      });
      if (res.ok) lastSaved = text;
    } catch (_) {
      /* молча, повторит следующий триггер */
    } finally {
      inFlight = false;
    }
  }

  function scheduleIdle(reason: string) {
    clearTimeout(tIdle);
    tIdle = setTimeout(() => save(reason), idleMs);
  }

  function onChange() { 
    scheduleIdle("idle-debounce"); 
  }

  // Периодически — даже если нет ввода
  tInterval = setInterval(() => save("interval"), intervalMs);

  // Перед закрытием вкладки
  function beforeUnload() {
    const text = opts.getText();
    if (text && text !== lastSaved) {
      navigator.sendBeacon?.(
        url,
        new Blob([JSON.stringify({ text, meta: { ...opts.meta, reason: "beforeunload" } })],
        { type: "application/json" })
      );
    }
  }
  
  window.addEventListener("beforeunload", beforeUnload);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) beforeUnload();
  });

  return {
    onChange,                   // дергай при каждом изменении текста
    stop() {
      clearTimeout(tIdle);
      clearInterval(tInterval);
      window.removeEventListener("beforeunload", beforeUnload);
      abort?.abort();
    }
  };
}