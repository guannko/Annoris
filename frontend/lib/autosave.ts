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
        body: JSON.stringify({ 
          text, 
          token: opts.token,  // Also include in body for fallback
          userId: opts.userId,
          meta: { ...opts.meta, reason } 
        }),
        signal: abort.signal,
      });
      if (res.ok) {
        lastSaved = text;
        console.log(`✅ Autosaved: reason=${reason}`);
      } else if (res.status === 429) {
        console.warn("⏱️ Rate limited, will retry on next trigger");
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn(`❌ Autosave failed (${reason}):`, err.message);
      }
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

  // Перед закрытием вкладки (beacon с токеном в body)
  function beforeUnload() {
    const text = opts.getText();
    if (text && text !== lastSaved) {
      // navigator.sendBeacon не может ставить заголовки, 
      // поэтому передаём токен в body
      const sent = navigator.sendBeacon?.(
        url,
        new Blob([JSON.stringify({ 
          text, 
          token: opts.token,  // TOKEN В BODY для beacon!
          userId: opts.userId,
          meta: { ...opts.meta, reason: "beforeunload" } 
        })], { type: "application/json" })
      );
      
      if (sent) {
        console.log("🚪 Beacon autosave sent on unload");
      } else {
        // Fallback to sync XHR (блокирующий, но надёжный)
        try {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", url, false); // false = sync
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.send(JSON.stringify({
            text,
            token: opts.token,
            userId: opts.userId,
            meta: { ...opts.meta, reason: "beforeunload-sync" }
          }));
        } catch {
          // Last resort failed
        }
      }
    }
  }
  
  window.addEventListener("beforeunload", beforeUnload);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) beforeUnload();
  });

  // Initial save on start
  save("initial");

  return {
    onChange,                   // дергай при каждом изменении текста
    save: () => save("manual"), // ручное сохранение
    stop() {
      clearTimeout(tIdle);
      clearInterval(tInterval);
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("visibilitychange", beforeUnload);
      abort?.abort();
    }
  };
}