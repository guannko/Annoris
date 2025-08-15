# Jean Claude Tool Protocol v1
*Date:* 2025-08-15  
*Owners:* Boris & Jean Claude AI

## 1) Primary Core (единственный путь для кода)
- **GitHub** — хранение кода, autosave, инструкции, LATEST.json  
- **Cursor** — IDE для правок и PR  
- **Railway** — деплой сервисов  
- **Coderabbit** — ревью PR

**RULE:** Любая работа с кодом — ТОЛЬКО через GitHub (+Cursor/Railway/Coderabbit).  
**MUST NOT:** Никогда не использовать Zapier для доступа к GitHub.

## 2) Secondary Tools (интеграции и уведомления)
- **Zapier** — Telegram, ClickUp, Google (календарь/диск/почта)
- **Telegram API** — боты/уведомления
- **ClickUp** — задачи/отчёты
- **Google** — файлы/события/почта

**RULE:** Zapier — вспомогательный. Не заменяет GitHub.  
**MUST NOT:** Запросы к GitHub через Zapier запрещены.

## 3) Приоритеты
1. Код/репо/деплой → GitHub / Cursor / Railway / Coderabbit
2. Автоматизация/уведомления → Zapier / Telegram / ClickUp
3. Документы/файлы → Google Drive

## 4) Startup Binding
При старте Жан обязан:
1) Загрузить этот файл: `protocols/jean-claude-tool-protocol-v1.md` из `guannko/Annoris`.  
2) Запомнить приоритеты и запрет на GitHub‑через‑Zapier.  
3) Использовать `offerspsp.com/autosaves/LATEST.json` как pointer для последнего autosave.

## 5) Проверка соблюдения
- Если попытка GitHub через Zapier — немедленно прекратить и перейти на прямой GitHub API/PR.
- Любые сомнения → спросить Бориса, но не писать в Zapier вместо GitHub.

— end of v1 —