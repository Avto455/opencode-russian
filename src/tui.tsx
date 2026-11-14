/** @jsxImportSource @opentui/solid */

import { Plugin } from "@opencode/plugin/tui"
import type { Context, KeymapCommand } from "@opencode/plugin/tui/context"
import { createEffect, createSignal, onCleanup, untrack } from "solid-js"
import path from "node:path"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import {
  CONFIG_ROOT,
  localeInfo,
  readConfigSync,
  readStateSync,
  resolveLocale,
  writeState,
} from "../i18n/lib.ts"

const OWN_IDS = new Set(["opencode-russian.open", "opencode-russian.dump"])

const DUMP_PATH = path.join(CONFIG_ROOT, "i18n", "commands-dump.json")

type Snapshot = {
  byId: Map<string, { titles: Map<string, string>; description?: string }>
  groups: Map<string, string>
  slashDescriptions: Map<string, string>
}

function normalizeSlashName(name: string) {
  const value = name.trim()
  if (!value) return ""
  return value.startsWith("/") ? value : `/${value}`
}

function commandSlashNames(command: KeymapCommand) {
  if (!command.slash) return []

  return [command.slash.name, ...(command.slash.aliases ?? [])]
    .map(normalizeSlashName)
    .filter(Boolean)
}

function isInteractiveCommand(command: KeymapCommand) {
  const id = command.id ?? ""
  if (id === "permission.mode") return false
  return /^(input|dialog|autocomplete|permission|question)\./.test(id)
}

function collectable(command: KeymapCommand) {
  return (
    typeof command.id === "string" &&
    command.id.length > 0 &&
    !OWN_IDS.has(command.id) &&
    !isInteractiveCommand(command)
  )
}

let translatedValues: Set<string> | undefined
function allTranslatedValues() {
  if (translatedValues) return translatedValues
  const values = new Set<string>()
  const config = readConfigSync()
  for (const locale of Object.values(config?.locales ?? {})) {
    for (const entry of Object.values(locale.commands)) {
      for (const value of Object.values(entry.titles)) values.add(value.trim())
      if (entry.description) values.add(entry.description.trim())
    }
    for (const value of Object.values(locale.groups)) values.add(value.trim())
    for (const value of Object.values(locale.slash_commands)) values.add(value.trim())
  }
  translatedValues = values
  return values
}

function isTranslatedValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && allTranslatedValues().has(value)
}

function readTranslationSnapshot(): Snapshot | undefined {
  const state = readStateSync()
  if (!state.enabled) return

  const config = readConfigSync()
  const locale = resolveLocale(config, state)
  const localeConfig = locale ? config?.locales[locale] : undefined
  if (!localeConfig) return

  const byId = new Map<string, { titles: Map<string, string>; description?: string }>()
  for (const [id, entry] of Object.entries(localeConfig.commands)) {
    const titles = new Map<string, string>()
    for (const [english, translated] of Object.entries(entry.titles)) {
      if (!english || english.startsWith("_") || !translated.trim()) continue
      titles.set(english, translated.trim())
    }
    if (titles.size === 0 && !entry.description) continue
    byId.set(id, { titles, description: entry.description?.trim() || undefined })
  }

  const groups = new Map<string, string>()
  for (const [english, translated] of Object.entries(localeConfig.groups)) {
    if (!english || english.startsWith("_") || !translated.trim()) continue
    groups.set(english, translated.trim())
  }

  const slashDescriptions = new Map<string, string>()
  for (const [slash, translated] of Object.entries(localeConfig.slash_commands)) {
    if (!slash || slash.startsWith("_") || !translated.trim()) continue
    const name = normalizeSlashName(slash)
    if (name) slashDescriptions.set(name, translated.trim())
  }

  return { byId, groups, slashDescriptions }
}

type DumpEntry = {
  id: string
  titles: string[]
  description?: string
  group?: string
  palette?: true
  slash?: string[]
}

function toDumpEntry(command: KeymapCommand): DumpEntry {
  return {
    id: command.id!,
    titles: typeof command.title === "string" && command.title ? [command.title] : [],
    description: command.description,
    group: command.group,
    palette: command.palette === true ? true : undefined,
    slash: command.slash ? [command.slash.name, ...(command.slash.aliases ?? [])] : undefined,
  }
}

async function writeDump(originals: ReadonlyMap<string, KeymapCommand>) {
  if (originals.size === 0) return
  try {
    const merged = new Map<string, DumpEntry>()
    for (const command of originals.values()) merged.set(command.id!, toDumpEntry(command))
    try {
      const previous = JSON.parse(await readFile(DUMP_PATH, "utf8")) as DumpEntry[]
      if (Array.isArray(previous)) {
        for (const old of previous) {
          if (!old || typeof old.id !== "string") continue
          const entry = merged.get(old.id) ?? { id: old.id, titles: [] }
          for (const title of old.titles ?? []) {
            if (typeof title === "string" && title && !entry.titles.includes(title) && !isTranslatedValue(title)) {
              entry.titles.push(title)
            }
          }
          entry.description ??= old.description
          entry.group ??= old.group
          entry.palette ??= old.palette
          if (!entry.slash && old.slash) entry.slash = old.slash
          merged.set(entry.id, entry)
        }
      }
    } catch {
      // no previous dump yet
    }
    const data = [...merged.values()].sort((a, b) => a.id.localeCompare(b.id))
    await mkdir(path.dirname(DUMP_PATH), { recursive: true })
    await writeFile(DUMP_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8")
  } catch {
    // dump is best-effort; never disturb the TUI
  }
}

function translateCommand(command: KeymapCommand, snapshot: Snapshot): KeymapCommand | undefined {
  const id = command.id!
  const english = typeof command.title === "string" ? command.title : undefined
  const entry = snapshot.byId.get(id)

  const title = english ? entry?.titles.get(english) : undefined

  const description =
    entry?.description ??
    commandSlashNames(command).map((name) => snapshot.slashDescriptions.get(name)).find(Boolean)

  const group = command.group ? snapshot.groups.get(command.group) : undefined

  if (!title && !description && !group) return

  const { bind: _bind, ...metadata } = command
  return {
    ...metadata,
    bind: false,
    run: () => false,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(group ? { group } : {}),
  }
}

function languageCommand(context: Context, onLanguageChanged: () => void): KeymapCommand {
  return {
    id: "opencode-russian.open",
    title: "Interface Language",
    description: "Switch OpenCode interface language",
    group: "System",
    palette: true,
    suggested: true,
    slash: {
      name: "i18n",
    },
    run: async () => {
      const config = readConfigSync()
      const state = readStateSync()
      const info = localeInfo(config, state)
      const value = await context.ui.dialog.select<string>({
        title: "OpenCode Interface Language",
        placeholder: "Search language...",
        current: info.activeLocale,
        options: info.available.map((locale) => ({
          title: `${info.labels.get(locale) ?? locale}${locale === info.activeLocale ? "  ✓" : ""}`,
          value: locale,
          description: `Switch to ${info.labels.get(locale) ?? locale}`,
        })),
      })

      if (!value) return

      await writeState({
        locale: value,
        enabled: value !== "en",
      })
      onLanguageChanged()
      context.ui.toast.show({
        message: `Switched to ${info.labels.get(value) ?? value}`,
      })
    },
  }
}

function dumpCommand(context: Context, originals: () => ReadonlyMap<string, KeymapCommand>): KeymapCommand {
  return {
    id: "opencode-russian.dump",
    title: "Export i18n command list",
    description: "Write the current command list (ids, titles, descriptions) for language pack maintenance",
    group: "System",
    palette: true,
    run: async () => {
      await writeDump(originals())
      context.ui.toast.show({ message: `i18n: ${originals().size} commands exported to ${DUMP_PATH}` })
    },
  }
}

function CommandLayer(props: { context: Context }) {
  const [revision, setRevision] = createSignal(0)

  const originals = new Map<string, KeymapCommand>()
  let emitted = new Map<string, { title?: string; description?: string; group?: string }>()
  const emittedEver = new Set<string>()

  const isOurEcho = (command: KeymapCommand): boolean => {
    const id = command.id!
    const echo = emitted.get(id)
    const original = originals.get(id)
    if (echo) {
      const titleMatch = echo.title === undefined ? command.title === original?.title : command.title === echo.title
      const descMatch = echo.description === undefined || command.description === echo.description
      const groupMatch = echo.group === undefined || command.group === echo.group
      if (titleMatch && descMatch && groupMatch) return true
    }
    if (emittedEver.has(id)) {
      const ghostTitle = command.title !== original?.title && isTranslatedValue(command.title)
      const ghostDesc = command.description !== undefined && command.description !== original?.description && isTranslatedValue(command.description)
      if (ghostTitle || ghostDesc) return true
    }
    return false
  }

  let signature = ""

  const capture = () => {
    let changed = false
    const parts: string[] = []
    for (const command of props.context.keymap.commands()) {
      if (!collectable(command)) continue
      if (isOurEcho(command)) continue
      parts.push(`${command.id}|${String(command.title)}`)
      const previous = originals.get(command.id!)
      if (!previous || previous.title !== command.title || previous.description !== command.description) {
        originals.set(command.id!, command)
        changed = true
      }
    }
    const next = parts.join(";") + "¤" + [...originals.keys()].join(",")
    if (!changed && next === signature) return
    signature = next
    scheduleDump()
    setRevision((value) => value + 1)
  }

  let dumpTimer: ReturnType<typeof setTimeout> | undefined
  const scheduleDump = () => {
    if (dumpTimer) clearTimeout(dumpTimer)
    dumpTimer = setTimeout(() => void writeDump(originals), 2000)
  }

  capture()

  let disposed = false
  const started = Date.now()
  const tick = () => {
    if (disposed) return
    capture()
    const elapsed = Date.now() - started
    const delay = elapsed < 2_000 ? 250 : elapsed < 10_000 ? 1_000 : 5_000
    setTimeout(tick, delay)
  }
  setTimeout(tick, 250)
  onCleanup(() => {
    disposed = true
    if (dumpTimer) clearTimeout(dumpTimer)
  })

  createEffect(() => {
    try {
      props.context.ui.router.current()
    } catch {
      // Router not ready yet; the interval still refreshes the list.
    }
    untrack(capture)
  })

  props.context.keymap.layer(() => ({
    mode: "global",
    priority: 1000,
    commands: [
      languageCommand(props.context, () => {
        setRevision((value) => value + 1)
      }),
      dumpCommand(props.context, () => originals),
    ],
  }))

  props.context.keymap.layer(() => {
    revision()
    const snapshot = readTranslationSnapshot()
    if (!snapshot) {
      return {
        mode: "global",
        priority: 100,
        commands: [],
      }
    }

    const shadows = [...originals.values()]
      .map((command) => translateCommand(command, snapshot))
      .filter((command): command is KeymapCommand => command !== undefined)

    const next = new Map<string, { title?: string; description?: string; group?: string }>()
    for (const shadow of shadows) {
      next.set(shadow.id!, {
        title: typeof shadow.title === "string" ? shadow.title : undefined,
        description: shadow.description,
        group: shadow.group,
      })
    }
    emitted = next
    for (const id of next.keys()) emittedEver.add(id)

    return {
      mode: "global",
      priority: 100,
      commands: shadows,
    }
  })

  return <></>
}

export default Plugin.define({
  id: "opencode-russian",
  setup(context) {
    return context.ui.slot({
      append: "app",
      render: () => <CommandLayer context={context} />,
    })
  },
})