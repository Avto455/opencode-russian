import { Plugin } from "@opencode/plugin"
import { Schema } from "effect"
import {
  CONFIG_PATH,
  STATE_PATH,
  localeInfo,
  readConfig,
  readState,
  resolveLocaleInput,
  writeState,
  type I18nState,
  type LocaleCode,
  type LocaleInfo,
} from "../i18n/lib.ts"

const ACTIONS = ["status", "set", "toggle", "locale", "locales"] as const

type Action = (typeof ACTIONS)[number]

type Messages = {
  unset: string
  noLocalesInline: string
  noLocales: string
  currentLanguage: string
  localization: string
  enabled: string
  disabled: string
  availableLanguages: string
  current: string
  default: string
  statusTitle: string
  lastUpdated: string
  languagePack: string
  stateFile: string
  availableCommands: string
  question: string
  commandOn: string
  commandOff: string
  commandToggle: string
  commandChoose: string
  refreshHint: string
  written: string
  setNeedsEnabled: string
  localeNeedsSelection: string
  unknownLanguage: string
  unknownAction: string
}

const MESSAGES: Record<string, Messages> = {
  en: {
    unset: "not set",
    noLocalesInline: "Available languages: no language packs found",
    noLocales: "No language packs found.",
    currentLanguage: "Current language",
    localization: "Localization",
    enabled: "enabled",
    disabled: "disabled",
    availableLanguages: "Available languages",
    current: "current",
    default: "default",
    statusTitle: "OpenCode interface localization",
    lastUpdated: "Last changed",
    languagePack: "Language pack",
    stateFile: "State file",
    availableCommands: "Available commands",
    question: "Choose OpenCode interface language",
    commandOn: "/i18n on - enable localized titles",
    commandOff: "/i18n off - disable localized titles",
    commandToggle: "/i18n toggle - toggle localization",
    commandChoose: "/i18n - choose language",
    refreshHint: "Tip: restart OpenCode if the interface does not refresh immediately.",
    written: "Written",
    setNeedsEnabled: "Provide enabled: true or enabled: false when setting the switch.",
    localeNeedsSelection: "Provide the language selected from question when switching language.",
    unknownLanguage: "Unknown language",
    unknownAction: "Unknown action",
  },
  ru: {
    unset: "не задано",
    noLocalesInline: "Доступные языки: языковые пакеты не найдены",
    noLocales: "Языковые пакеты не найдены.",
    currentLanguage: "Текущий язык",
    localization: "Локализация",
    enabled: "включена",
    disabled: "выключена",
    availableLanguages: "Доступные языки",
    current: "текущий",
    default: "по умолчанию",
    statusTitle: "Локализация интерфейса OpenCode",
    lastUpdated: "Последнее изменение",
    languagePack: "Языковой пакет",
    stateFile: "Файл состояния",
    availableCommands: "Доступные команды",
    question: "Выберите язык интерфейса OpenCode",
    commandOn: "/i18n on — включить локализованные заголовки",
    commandOff: "/i18n off — выключить локализованные заголовки",
    commandToggle: "/i18n toggle — переключить локализацию",
    commandChoose: "/i18n — выбрать язык",
    refreshHint: "Подсказка: перезапустите OpenCode, если интерфейс не обновился сразу.",
    written: "Записано",
    setNeedsEnabled: "При установке переключателя укажите enabled: true или enabled: false.",
    localeNeedsSelection: "При смене языка укажите язык, выбранный в диалоге.",
    unknownLanguage: "Неизвестный язык",
    unknownAction: "Неизвестное действие",
  },
}

function messages(locale: LocaleCode | undefined) {
  return MESSAGES[locale ?? ""] ?? MESSAGES.en
}

async function readLocaleInfo(state: I18nState): Promise<LocaleInfo> {
  return localeInfo(await readConfig(), state)
}

function localeConfig(info: LocaleInfo, locale: LocaleCode | undefined) {
  return locale ? info.config?.locales[locale] : undefined
}

function formatLocale(locale: string | undefined, info: LocaleInfo, text: Messages) {
  if (!locale) return text.unset
  const label = info.labels.get(locale)
  return label && label !== locale ? `${locale} (${label})` : locale
}

function formatAvailableLocales(info: LocaleInfo, text: Messages) {
  if (info.available.length === 0) return text.noLocalesInline

  return `${text.availableLanguages}: ${info.available.map((locale) => formatLocale(locale, info, text)).join(", ")}`
}

function localesMessage(state: I18nState, info: LocaleInfo) {
  const text = messages(info.activeLocale)
  const activeConfig = localeConfig(info, info.activeLocale)
  const fallbackConfig = localeConfig(info, "en")
  if (info.available.length === 0) return text.noLocales
  const current = formatLocale(info.activeLocale, info, text)
  const questionData = {
    locale: info.activeLocale ?? "",
    question: `${activeConfig?.language_picker.question ?? text.question} (${text.currentLanguage}: ${current})`,
    options: info.available.map((locale) => ({
      label: info.labels.get(locale) ?? locale,
      locale,
      description:
        activeConfig?.language_picker.option_descriptions[locale] ??
        fallbackConfig?.language_picker.option_descriptions[locale] ??
        `Switch to ${info.labels.get(locale) ?? locale}`,
    })),
  }

  return [
    `${text.currentLanguage}: ${current}`,
    `${text.localization}: ${state.enabled ? text.enabled : text.disabled}`,
    `${text.availableLanguages}:`,
    ...info.available.map((locale) => {
      const label = info.labels.get(locale) ?? locale
      const markers = [
        locale === info.activeLocale ? text.current : "",
        locale === info.defaultLocale ? text.default : "",
      ].filter(Boolean)
      const suffix = markers.length > 0 ? ` (${markers.join(", ")})` : ""
      return `- ${label} => ${locale}${suffix}`
    }),
    "",
    "QUESTION_DATA:",
    JSON.stringify(questionData),
  ].join("\n")
}

function statusMessage(state: I18nState, info: LocaleInfo) {
  const text = messages(info.activeLocale)
  const status = state.enabled ? text.enabled : text.disabled
  const updated = state.updatedAt ? `\n${text.lastUpdated}: ${state.updatedAt}` : ""

  return [
    `${text.statusTitle}: ${status}${updated}`,
    `${text.currentLanguage}: ${formatLocale(info.activeLocale, info, text)}`,
    `${text.languagePack}: ${CONFIG_PATH}`,
    `${text.stateFile}: ${STATE_PATH}`,
    formatAvailableLocales(info, text),
    "",
    `${text.availableCommands}:`,
    text.commandOn,
    text.commandOff,
    text.commandToggle,
    text.commandChoose,
    "",
    text.refreshHint,
  ].join("\n")
}

const i18nStateInput = Schema.Struct({
  action: Schema.Literals(ACTIONS),
  enabled: Schema.optional(Schema.Boolean),
  locale: Schema.optional(Schema.String),
})

export default Plugin.define({
  id: "opencode-russian",
  async setup(ctx) {
    await ctx.tool.transform((draft) => {
      draft.add({
        name: "i18n-state",
        description: "Manage OpenCode interface localization state and language.",
        input: i18nStateInput,
        async execute(args) {
          const action = args.action as Action

          if (action === "status") {
            const state = await readState()
            return { content: statusMessage(state, await readLocaleInfo(state)) }
          }

          if (action === "locales") {
            const state = await readState()
            return { content: localesMessage(state, await readLocaleInfo(state)) }
          }

          if (action === "set") {
            const current = await readState()
            const info = await readLocaleInfo(current)
            const text = messages(info.activeLocale)
            if (typeof args.enabled !== "boolean") return { content: text.setNeedsEnabled }
            const state = await writeState({ enabled: args.enabled })
            return { content: `${statusMessage(state, await readLocaleInfo(state))}\n\n${text.written}: ${STATE_PATH}` }
          }

          if (action === "toggle") {
            const current = await readState()
            const info = await readLocaleInfo(current)
            const text = messages(info.activeLocale)
            const state = await writeState({ enabled: !current.enabled })
            return { content: `${statusMessage(state, await readLocaleInfo(state))}\n\n${text.written}: ${STATE_PATH}` }
          }

          if (action === "locale") {
            const rawLocale = args.locale?.trim()
            const current = await readState()
            const info = await readLocaleInfo(current)
            const currentText = messages(info.activeLocale)
            if (!rawLocale) return { content: currentText.localeNeedsSelection }

            const locale = resolveLocaleInput(rawLocale, info)
            if (info.available.length > 0 && !info.available.includes(locale)) {
              return { content: [`${currentText.unknownLanguage}: ${locale}`, formatAvailableLocales(info, currentText)].join("\n") }
            }

            const state = await writeState({ locale, enabled: locale !== "en" })
            const nextInfo = await readLocaleInfo(state)
            const nextText = messages(nextInfo.activeLocale)
            return { content: `${statusMessage(state, nextInfo)}\n\n${nextText.written}: ${STATE_PATH}` }
          }

          const state = await readState()
          const info = await readLocaleInfo(state)
          return { content: `${messages(info.activeLocale).unknownAction}: ${action}` }
        },
      })
    })
  },
})