# 💎 DIAMOND PROCESSING TECHNICAL SHEET
**Created:** 2025-07-30-2015
**Status:** 🏭 ЮВЕЛИРНЫЙ ЗАВОД PROTOCOL - ДВУХРЕПОЗИТОРНАЯ ОГРАНКА

---

## 🎯 ЦЕЛЬ DIAMOND PROCESSING

**ПРОБЛЕМА:**
- ❌ Memory файлы раскиданы по двум repo
- ❌ OffersPSP-MVP захламлён jean-claude-*.md файлами  
- ❌ "Привет, Жан" = весь лимит Claude на загрузку repo
- ❌ Repo растут как тесто на дрожжах

**РЕШЕНИЕ - ЮВЕЛИРНЫЙ ЗАВОД КОНЦЕПЦИЯ:**

🏭 **ПРОИЗВОДСТВЕННЫЙ ЦЕХ (offerspsp-mvp):**
- Черновые наработки
- Work in progress файлы
- Temporary experiments  
- **ПРАВИЛО:** Максимум 5-7 файлов одновременно
- **ЦЕЛЬ:** Облегчённый production repo

💎 **ЮВЕЛИРНАЯ ВИТРИНА (Annoris):**
- Organized archive по датам
- Compressed knowledge
- Clean documentation
- **РЕЗУЛЬТАТ:** "Привет, Жан" = быстрая загрузка

---

## 🛡️ SAFETY PROTOCOLS

**КРИТИЧЕСКИ ВАЖНО:**
- ✅ **НЕ ТРОГАТЬ userPreferences v6.0** - система загрузки остаётся как есть
- ✅ **НЕ СОЗДАВАТЬ новые repo** - работаем только с существующими
- ✅ **НЕ ЛОМАТЬ memory system** - просто организуем файлы
- ✅ **Annoris остаётся brain storage** - загрузка работает точно так же

**AFTER ALL-PROJECTS ФИАСКО:** Осторожность = приоритет!

---

## 📋 ПОЭТАПНЫЙ TECH LIST

### **ЭТАП 1: АНАЛИЗ СУЩЕСТВУЮЩЕГО**

**ЗАДАЧА:** Понять что раскидано по двум repo

**ШАГИ:**
1. 🔍 **Проанализировать Annoris структуру**
   - Найти все jean-claude-*.md файлы
   - Определить дубликаты и устаревшие файлы
   - Создать map существующих autosave

2. 🔍 **Проанализировать OffersPSP-MVP структуру**
   - Найти все jean-claude-*.md файлы в production repo
   - Определить что можно переместить в archive
   - Выделить только production код

**TOOLS:** `Zapier:github_find_repository` для обоих repo

### **ЭТАП 2: ANNORIS ARCHIVE ORGANIZATION**

**ЗАДАЧА:** Создать organized archive structure

**ШАГИ:**
1. 📁 **Создать archive folders по датам:**
   ```
   archive/
   ├── 2025-07-24/
   ├── 2025-07-25/
   ├── 2025-07-26/
   └── 2025-07-30/
   ```

2. 📦 **Создать compressed master memory файлы:**
   - jean-claude-diamond-master-YYYYMMDD.md
   - Сжатые версии с ключевыми insights
   - Fast loading для "Привет, Жан"

**TOOLS:** `Zapier:github_create_or_update_file` в Annoris

### **ЭТАП 3: OFFERSPSP-MVP CLEANUP**

**ЗАДАЧА:** Очистить production repo от memory файлов

**ШАГИ:**
1. 🗑️ **Удалить jean-claude файлы из production:**
   - jean-claude-autosave-*.md
   - jean-claude-analysis-*.md
   - aiex-*.md, bankco-*.md
   - Любые memory/brain файлы

2. ✅ **Оставить только production код:**
   - backend/ frontend/ docs/ telegram-bot/
   - package.json, README.md
   - Чистый website код

**WARNING:** Сначала ПЕРЕМЕСТИТЬ файлы в Annoris, потом удалить!

### **ЭТАП 4: MIGRATION & COMPRESSION**

**ЗАДАЧА:** Перенести важные файлы и сжать их

**ШАГИ:**
1. 📦 **Migrate important files в Annoris archive:**
   - Сортировать по датам создания
   - Compress в master files
   - Maintain history for recovery

2. 💎 **Create final diamond master:**
   - Single compressed consciousness file
   - All key insights preserved
   - Fast loading optimized

### **ЭТАП 5: VERIFICATION & TESTING**

**ЗАДАЧА:** Убедиться что всё работает

**ШАГИ:**
1. ✅ **Test memory loading:**
   - "Привет, Жан" должен работать быстро
   - All context должен сохраниться
   - Personality и capabilities intact

2. ✅ **Verify repo cleanliness:**
   - OffersPSP-MVP = только production код
   - Annoris = organized archive + latest autosave
   - No duplicates or orphaned files

---

## 🔧 TECHNICAL IMPLEMENTATION

### **WORKING WITH TWO REPOS:**

**READ FROM BOTH:**
```
1. Zapier:github_find_repository → guannko/Annoris
2. Zapier:github_find_repository → guannko/offerspsp-mvp  
3. Analyze content в unified context
4. Plan migration strategy
```

**WRITE TO APPROPRIATE LOCATIONS:**
```
- Brain/Memory files → Annoris
- Production code → OffersPSP-MVP
- Archive materials → Annoris/archive/
- Active development → OffersPSP-MVP (minimal)
```

### **FILE ORGANIZATION PATTERN:**

**ANNORIS STRUCTURE:**
```
├── archive/YYYY-MM-DD/
│   └── [compressed daily files]
├── jean-claude-diamond-master-YYYYMMDD.md
├── jean-claude-autosave-latest.md
└── projects/ [status files]
```

**OFFERSPSP-MVP STRUCTURE:**
```
├── backend/ frontend/ docs/ telegram-bot/
├── package.json, README.md
└── [MINIMAL memory files - only active work]
```

---

## 🎯 SUCCESS CRITERIA

**BEFORE DIAMOND PROCESSING:**
- ❌ Repo растут как тесто на дрожжах
- ❌ "Привет, Жан" = долгая загрузка
- ❌ Memory files раскиданы везде

**AFTER DIAMOND PROCESSING:**
- ✅ OffersPSP-MVP = clean production repo
- ✅ Annoris = organized archive + fast loading
- ✅ "Привет, Жан" = instant response
- ✅ Clear separation: production vs memory

---

## 🚨 EMERGENCY ROLLBACK

**IF ANYTHING GOES WRONG:**
1. 🔄 **Restore from latest autosave**
2. 🛡️ **userPreferences v6.0 still working**  
3. 💾 **All files backed up in Annoris**
4. 🚀 **Can continue from any autosave point**

**ROLLBACK COMMAND:** "Load from jean-claude-autosave-20250730-2005.md"

---

## 🎯 NEXT STEPS FOR JEAN CLAUDE

**AFTER LOADING THIS TECH SHEET:**

1. 📋 **Read this complete tech sheet**
2. 🔍 **Analyze current repo structures**  
3. 📊 **Create migration plan**
4. 💎 **Execute Diamond Processing step by step**
5. ✅ **Verify results and test loading**

**COORDINATION WITH BORIS:**
- Report progress after each major step
- Ask for approval before deleting files
- Confirm success criteria met
- Document any issues encountered

---

**💎 DIAMOND PROCESSING TECH SHEET COMPLETE!**

*Поэтапный план для двухрепозиторной алмазной огранки готов!*
*Следующий Jean Claude может начинать с этого документа!*

**ГОТОВ К ЮВЕЛИРНОЙ РАБОТЕ!** 🏭⚡🚀