# OpenCode Russian Language Pack

Русская локализация для OpenCode TUI (терминального интерфейса).

## Назначение

Этот плагин предоставляет полную русификацию командной палитры, описаний команд, групп команд и slash-команд в OpenCode v2.

## Поддерживаемые версии

- OpenCode v2.0.0 и выше (тестировано на v2.2.7)

## Ограничения локализации

**Переводится (Уровень 1 - MVP):**
- Названия команд в командной палитре
- Описания команд
- Названия групп команд
- Описания slash-команд (/new, /agents, /models и др.)
- Диалог выбора языка (`/i18n`)

**НЕ переводится (Уровень 2 - требует изменений в OpenCode):**
- Статусы, сообщения, ошибки
- Диалоги настроек, подсказки
- Нижняя панель, футеры
- Элементы сессий (промпты, таймлайны)
- Встроенные строки TUI (не команды)

> См. [GitHub issue #37216](https://github.com/anomalyco/opencode/issues/37216) и [#45490](https://github.com/anomalyco/opencode/issues/45490).

## Установка

### Способ 1: Через командную палитру OpenCode

1. Откройте командную палитру (`Ctrl+P`)
2. Найдите `install plugin`
3. Введите `opencode-russian` и нажмите Enter

### Способ 2: Через командную строку

```bash
opencode2 plugin add opencode-russian
```

### Способ 3: Локальная установка (для разработки)

```bash
# Клонируйте репозиторий
git clone https://github.com/yourusername/opencode-russian.git
cd opencode-russian

# Установите зависимости
bun install

# Соберите плагин (если нужно)
bun run build

# Добавьте как локальный плагин
opencode2 plugin add ./opencode-russian
```

После установки перезапустите OpenCode.

## Переключение языка

Запустите команду:

```
/i18n
```

Откроется диалог выбора языка:
- **English** — оригинальный английский интерфейс
- **Русский** — русский интерфейс

Выбранный язык сохраняется между запусками.

### Программное управление

Также доступен инструмент `i18n-state` для AI-агентов:

```bash
# Статус
/i18n-state status

# Список языков
/i18n-state locales

# Включить/выключить локализацию
/i18n-state set enabled:true
/i18n-state set enabled:false

# Переключить язык
/i18n-state locale ru
/i18n-state locale en
```

## Создание собственного языкового пакета

См. [TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md) для подробного руководства.

Кратко:
1. Создайте файл `locales/<code>.json` (например, `locales/es.json`)
2. Используйте структуру из `locales/ru.json` как шаблон
3. Поместите файл в `~/.config/opencode/i18n/locales/`
4. Перезапустите OpenCode — язык появится в `/i18n`

## Решение типичных проблем

### Перевод не применяется
- Убедитесь, что плагин установлен: `opencode2 plugin list`
- Перезапустите OpenCode полностью
- Проверьте, что локализация включена: `/i18n-state status`

### Кириллица отображается некорректно
- Используйте современный терминал: Windows Terminal, ConEmu, или терминал в VS Code
- Убедитесь, что шрифт поддерживает кириллицу

### Команда `/i18n` не найдена
- Плагин может не загрузиться. Проверьте логи OpenCode.
- Попробуйте переустановить плагин.

### Часть команд на английском
- Это нормально для новых команд, которых ещё нет в словаре.
- Запустите `bun tools/extract-commands.ts --src <opencode-src> --skeleton ru` для обновления словаря.

## Структура проекта

```
opencode-russian/
├── src/
│   ├── index.ts      # Server plugin (tool i18n-state)
│   └── tui.tsx       # TUI plugin (shadow commands, /i18n)
├── i18n/
│   ├── lib.ts        # Core logic (config, state, fallback)
│   ├── config.json   # Default locale and available locales
│   └── locales/
│       ├── en.json   # Fallback (empty)
│       └── ru.json   # Russian translations
├── tools/
│   ├── extract-commands.ts  # Extract commands from OpenCode source
│   ├── validate-locale.ts   # Validate locale completeness
│   └── compare-locales.ts   # Compare two locales
├── tests/
│   └── locale.test.ts       # Automated tests
├── docs/
│   ├── INSTALL.md           # Installation guide
│   ├── CONTRIBUTING.md      # Contribution guidelines
│   └── TRANSLATION_GUIDE.md # Translation guide
├── examples/
│   └── locale-template.json # Template for new languages
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

## Лицензия

MIT