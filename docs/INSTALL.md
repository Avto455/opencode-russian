# Руководство по установке (Windows)

## Требования

- Windows 10/11
- OpenCode v2.0.0 или выше
- Современный терминал с поддержкой UTF-8 (Windows Terminal, ConEmu, VS Code Terminal)

## Установка плагина

### Вариант 1: Через OpenCode (рекомендуется)

1. Откройте OpenCode
2. Нажмите `Ctrl+P` для открытия командной палитры
3. Начните вводить `install plugin`
4. Выберите "Install plugin" из списка
5. Введите `opencode-russian` и нажмите Enter
6. Перезапустите OpenCode

### Вариант 2: Через командную строку

```powershell
# Убедитесь, что opencode доступен в PATH
opencode2 plugin add opencode-russian
```

### Вариант 3: Локальная разработка

Если вы клонировали репозиторий локально:

```powershell
# Перейдите в папку проекта
cd D:\path\to\opencode-russian

# Установите зависимости
bun install

# Добавьте как локальный плагин
opencode2 plugin add .
```

## Проверка установки

После перезапуска OpenCode:

1. Введите `/i18n` — должен открыться диалог выбора языка
2. Выберите "Русский" — интерфейс командной палитры переключится на русский
3. Откройте командную палитру (`Ctrl+P`) — названия команд и группы должны быть на русском

## Настройка терминала для корректного отображения кириллицы

### Windows Terminal (рекомендуется)

1. Установите [Windows Terminal](https://github.com/microsoft/terminal) из Microsoft Store
2. Откройте настройки (`Ctrl+,`)
3. В профиле OpenCode установите шрифт, поддерживающий кириллицу:
   - Cascadia Code (встроен)
   - JetBrains Mono
   - Fira Code
   - Consolas

### PowerShell 7+

```powershell
# Установите шрифт для текущей сессии
$Host.UI.RawUI.FontFace = "Cascadia Code"
```

### VS Code Terminal

1. Откройте настройки (`Ctrl+,`)
2. Найдите `terminal.integrated.fontFamily`
3. Установите: `"Cascadia Code", "Consolas", "monospace"`

## Удаление плагина

```powershell
opencode2 plugin remove opencode-russian
```

Или через командную палитру: `uninstall plugin` → `opencode-russian`.

## Возможные проблемы

### Плагин не появляется в списке
- Проверьте версию OpenCode: `opencode --version` (должно быть 2.x)
- Попробуйте обновить OpenCode: `opencode update`

### Кириллица отображается как вопросительные знаки или квадраты
- Смените терминал на Windows Terminal
- Проверьте шрифт в настройках терминала

### Команда `/i18n` не работает
- Перезапустите OpenCode полностью
- Проверьте, что плагин загружен: `opencode2 plugin list`

### Перевод не применяется к некоторым командам
- Это нормально для новых команд, добавленных в последних версиях OpenCode
- Словарь обновляется с каждым релизом плагина