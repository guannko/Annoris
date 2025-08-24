# ⚠️ MANUAL MIGRATION NEEDED
**Created:** 2025-08-24 20:55
**By:** Jean Claude v9.01

## 📋 FILES TO MANUALLY COPY FROM ALL-Projects:

Boris, пожалуйста, скопируй эти файлы вручную из ALL-Projects в соответствующие папки:

### 1. В папку `historical/ALL-Projects-archive/first-autosaves/`:
```
- jean-claude-autosave-20250730-0810.md
- jean-claude-autosave-20250730-0845.md
- jean-claude-autosave-20250730-0905.md
```

### 2. В папку `historical/ALL-Projects-archive/`:
```
- memory-scan-annoris.md
- railway-deployment-plan.md
```

### 3. Если в папке `sync/` есть файлы, скопируй их в:
```
historical/ALL-Projects-archive/sync-protocols/
```

## ✅ ПОСЛЕ КОПИРОВАНИЯ:

1. **Удали из ALL-Projects:**
   - AUDIT-IN-PROGRESS.md
   - AUDIT-REPORT-20250824.md
   - Issue #1 можно закрыть

2. **Обнови README в ALL-Projects:**
   ```markdown
   # ⚠️ DEPRECATED REPOSITORY
   **Status:** ARCHIVED
   **Deprecated:** 2025-08-24
   **Replaced by:** brain-idx
   
   Historical documents moved to Annoris/historical/
   ```

3. **Архивируй репозиторий:**
   - Settings → Archive this repository

## 📝 ПРИЧИНА РУЧНОЙ МИГРАЦИИ:
Zapier не может читать содержимое файлов из других репозиториев, только создавать/обновлять.

---
*После выполнения этот файл можно удалить*