# MySQL EXPLAIN Visualizer — Design Document

Дата: 2026-02-16

## 1. Цель и аудитория

**Цель:** Визуализировать JSON-вывод `EXPLAIN FORMAT=JSON` в виде интерактивной блок-схемы для быстрого понимания плана выполнения запроса.

**Аудитория:** Широкая — от junior-разработчиков до опытных DBA. Интерфейс должен быть интуитивным для новичков, но содержать полную информацию для профессионалов.

## 2. Стек технологий

| Компонент | Технология |
|-----------|------------|
| Framework | React 18+ |
| Build | Vite |
| Styling | Tailwind CSS |
| Visualization | React Flow |
| Деплой | gh-pages (static) |

## 3. Архитектура приложения

```
src/
├── components/
│   ├── InputPanel/      # Боковая панель с textarea
│   ├── FlowChart/       # React Flow визуализация
│   ├── ExplainNode/     # Кастомная нода для React Flow
│   └── ErrorBlock/      # Блок ошибок
├── hooks/
│   └── useExplainParser.ts
├── utils/
│   ├── parser.ts        # Парсинг JSON → дерево
│   └── transformer.ts   # Дерево → React Flow nodes/edges
└── types/
    └── explain.ts       # TypeScript типы для EXPLAIN JSON
```

## 4. Data Flow

```
[JSON Input] → [Parser] → [ExplainTree] → [Transformer] → [React Flow nodes/edges]
                                     ↓
                              [ErrorBlock]
```

**Парсер:**
- Валидирует JSON-синтаксис
- Проверяет структуру EXPLAIN (наличие `query_block`)
- Возвращает типизированное дерево или ошибку с позицией

**Трансформер:**
- Рекурсивно обходит `query_block`, `nested_loop`, `ordering_operation`, etc.
- Создаёт `nodes[]` с позицией (автокомпоновка React Flow)
- Создаёт `edges[]` со стрелками между операциями
- Вычисляет `isCritical` для подсветки

## 5. ExplainNode (кастомная нода)

**Вид по умолчанию (средний уровень):**
```
┌─────────────────────────────┐
│ nested_loop                 │  ← тип операции
│ ─────────────────────────── │
│ users                       │  ← таблица
│ key: PRIMARY                │  ← используемый индекс
│ rows: 1,024                 │  ← rows_examined
└─────────────────────────────┘
```

**При клике/hover — тултип с деталями:**
- `cost_info` (время, ресурсы)
- `attached_condition` (WHERE-условия)
- `used_columns` (выбранные колонки)
- Полный список полей для продвинутых пользователей

**Цветовая кодировка:**
- Красная рамка — `FULL TABLE SCAN`, `Using filesort`, `Using temporary`
- Нейтральная — всё остальное

## 6. InputPanel (боковая панель)

**Структура:**
```
┌─────────────────────────┐
│ EXPLAIN JSON            │  ← заголовок
│ ─────────────────────── │
│ [textarea]              │  ← ввод JSON
│                         │
│ ─────────────────────── │
│ Error: ...              │  ← ErrorBlock (если есть)
│ ─────────────────────── │
│ [ Visualize ]           │  ← кнопка парсинга
└─────────────────────────┘
```

**Функции:**
- Resizable по горизонтали (min: 280px, max: 500px, default: 350px)
- Автоматический парсинг при валидном JSON (debounce 500ms)
- Кнопка "Visualize" для принудительного парсинга
- Пример JSON в placeholder для новичков

## 7. ErrorBlock

**Типы ошибок:**

| Код | Описание | Показывать |
|-----|----------|------------|
| `PARSE_ERROR` | Невалидный JSON | Позиция символа |
| `INVALID_FORMAT` | Не EXPLAIN структура | Что не так |
| `EMPTY_INPUT` | Пустой ввод | Подсказка |

**Стиль:** Красный фон, иконка предупреждения, читаемое сообщение.

## 8. Deployment (gh-pages)

**Сборка:**
```bash
npm run build  # → dist/
```

**Конфиг Vite:**
```ts
export default defineConfig({
  base: '/mysql-explain-visualizer/',
  build: { outDir: 'dist' }
})
```

**GitHub Actions (автоматический деплой):**
- Триггер: push в `main`
- Шаги: install → build → deploy to gh-pages

## 9. MVP Scope

**Включено:**
- Парсинг `EXPLAIN FORMAT=JSON`
- Визуализация в виде блок-схемы
- Подсветка критичных операций
- Тултипы с деталями

**Отложено:**
- История планов (localStorage)
- Шаринг через URL (base64)
- Экспорт в PNG/SVG
