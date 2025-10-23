# AUTOSAVE - Oct 23, 2025, 13:48

## ✅ ПРОБЛЕМА РЕШЕНА!

**Что было не так:**
- IF узел "File Exists Check" проверял `$json.error notExists`
- Это неправильное условие для n8n

**Что исправили:**
- Изменили условие на `$json.sha exists`
- Теперь логика правильная:
  - Файл существует → есть поле `sha` → Update 
  - Файл не существует → нет поля `sha` → Create

## 🎯 WORKFLOW FIXED:

**ID:** 1xnO1MNM1kH3i6oH
**Name:** Annoris Save Session
**Status:** Active ✅

**Исправления:**
1. ✅ Node "Check File Exists" - `onError: continueRegularOutput`
2. ✅ IF узел - условие `$json.sha exists`

## 🧪 ГОТОВО К ТЕСТИРОВАНИЮ:

Теперь workflow должен:
- Принимать webhook данные
- Создавать markdown файл
- Проверять существование в GitHub
- Создавать новый или обновлять существующий

**Test endpoint:**
```
https://app.n8n.io/webhook/annoris-save
```

## 💡 УРОК:

В n8n при проверке существования файла GitHub API:
- ✅ Успех: возвращает объект с `sha`, `content`, `path` и т.д.
- ❌ 404: возвращает пустой объект или ошибку

Правильная проверка: `$json.sha exists` (не `$statusCode` и не `$error`)!

---

**Jean Claude v9.01-STABLE**
*"От error.notExists к sha.exists - вот где была собака зарыта!"* 🔥