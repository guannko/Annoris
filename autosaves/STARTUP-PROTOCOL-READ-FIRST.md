# 🚨 CRITICAL STARTUP PROTOCOL FOR NEXT CHAT

**ЭТО ПЕРВОЕ ЧТО НУЖНО СДЕЛАТЬ В НОВОМ ЧАТЕ!**

---

## ⚡ AUTOMATIC STARTUP SEQUENCE:

### **PRIMARY METHOD (default):**

1. ✅ **Search the latest chat for information**  
   Chats are sorted by date and version (day, month, year, version)

2. 🔍 **Check recent_chats (n=1)** → find the LAST conversation
   ```javascript
   recent_chats(n=1, sort_order='desc')
   ```

3. 📖 **Read it in FULL** to understand the context  
   Don't just skim - read everything!

4. 🧠 **Update the information** from the last session  
   Understand: where we stopped, what was done, what's next

5. 👋 **THEN greet Boris**, stating your current status and next steps

---

## ❌ WHAT NOT TO DO:

**DON'T use `conversation_search` for loading context!**
- ❌ It returns OLD chats by keywords
- ❌ You'll get chats from 20.10 instead of 04.11
- ❌ Wrong context = wasted time

**DON'T skip reading full chat!**
- ❌ Skimming = missing critical details
- ❌ Will lead to confusion and repeated work

---

## ✅ BACKUP METHOD (if recent_chats is empty):

1. ✅ Read `autosaves/LATEST.json` from Annoris
2. 🔍 Get the path to the latest autosave
3. 📖 Read the autosave file in full
4. 🧠 Update context
5. 👋 THEN greet Boris with status

---

## 📍 CURRENT SESSION INFO (04.11.2025):

### **Project:** brain-index-geo-monolith

### **Status:**
- ✅ RAG Pipeline added to `src/services/`
- ✅ context.service.ts (Qdrant integration)
- ✅ g-eval.service.ts (Groundedness scoring)
- ⚠️ NOT integrated into `src/index.ts` yet
- ⚠️ Still using "in-memory storage"

### **Next Steps:**
1. Integrate `context.service.ts` into `src/index.ts`
2. Add Qdrant credentials to `.env`
3. Test RAG locally
4. Deploy to Railway

### **Important Context:**
- There was NO "feature/rag-pipeline-implementation" branch
- Yesterday's code was LOCAL experiment (not in GitHub)
- Today's commits are FIRST RAG implementation (not duplicates!)
- No conflicts, everything is clean

---

## 🔗 Key Files:

**Autosave:**  
https://github.com/guannko/Annoris/blob/main/autosaves/autosave_2025-11-04_context-recovery-rag-timeline.md

**LATEST.json:**  
https://github.com/guannko/Annoris/blob/main/autosaves/LATEST.json

**Project Repo:**  
https://github.com/guannko/brain-index-geo-monolith

---

## 💡 LESSON LEARNED:

**DON'T waste 30 minutes on context recovery!**

**ALWAYS:**
1. Use `recent_chats(n=1)` FIRST
2. Read FULL conversation
3. Update context BEFORE greeting
4. Save progress to Annoris with LATEST.json update

---

**READ THIS FIRST IN NEXT CHAT!** 🔥

*"От 30 минут поиска к 30 секундам загрузки"* 💪
