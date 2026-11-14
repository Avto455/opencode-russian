/**
 * Validate locale pack completeness and correctness.
 * Usage: bun tools/validate-locale.ts --locale ru
 */

import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const args = process.argv.slice(2)
function opt(name: string) {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const LOCALE = opt("locale") ?? "ru"
const V2_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..")
const LOCALE_FILE = path.join(V2_ROOT, "i18n", "locales", `${LOCALE}.json`)

if (!LOCALE) {
  console.error("Usage: bun tools/validate-locale.ts --locale <locale-code>")
  process.exit(1)
}

const data = JSON.parse(readFileSync(LOCALE_FILE, "utf8"))

let totalCommands = 0
let translatedCommands = 0
let totalTitles = 0
let translatedTitles = 0
let totalDescriptions = 0
let translatedDescriptions = 0
let totalGroups = 0
let translatedGroups = 0
let totalSlash = 0
let translatedSlash = 0
const missingTitles: [string, string][] = []
const missingDescriptions: string[] = []
const missingGroups: string[] = []
const missingSlash: string[] = []
const emptyTitles: [string, string][] = []
const emptyDescriptions: string[] = []
const emptyGroups: string[] = []
const emptySlash: string[] = []

for (const [id, cmd] of Object.entries(data.commands as Record<string, { titles: Record<string, string>; description?: string }>)) {
  totalCommands++
  let hasTranslation = false
  for (const [en, ru] of Object.entries(cmd.titles)) {
    totalTitles++
    if (ru && ru.trim()) {
      translatedTitles++
      hasTranslation = true
    } else {
      missingTitles.push([id, en])
    }
    if (ru === "") emptyTitles.push([id, en])
  }
  if (cmd.description) {
    totalDescriptions++
    if (cmd.description.trim()) {
      translatedDescriptions++
      hasTranslation = true
    } else {
      missingDescriptions.push(id)
    }
    if (cmd.description === "") emptyDescriptions.push(id)
  }
  if (hasTranslation) translatedCommands++
}

for (const [en, ru] of Object.entries(data.groups as Record<string, string>)) {
  totalGroups++
  if (ru && ru.trim()) translatedGroups++
  else missingGroups.push(en)
  if (ru === "") emptyGroups.push(en)
}

for (const [slash, ru] of Object.entries(data.slash_commands as Record<string, string>)) {
  totalSlash++
  if (ru && ru.trim()) translatedSlash++
  else missingSlash.push(slash)
  if (ru === "") emptySlash.push(slash)
}

console.log(`=== Locale Validation: ${LOCALE} ===`)
console.log(`Locale name: ${data.name}`)
console.log()
console.log(`Commands:     ${translatedCommands} / ${totalCommands} translated`)
console.log(`  Titles:       ${translatedTitles} / ${totalTitles} translated (${missingTitles.length} missing, ${emptyTitles.length} empty)`)
console.log(`  Descriptions: ${translatedDescriptions} / ${totalDescriptions} translated (${missingDescriptions.length} missing, ${emptyDescriptions.length} empty)`)
console.log(`Groups:       ${translatedGroups} / ${totalGroups} translated (${missingGroups.length} missing, ${emptyGroups.length} empty)`)
console.log(`Slash cmds:   ${translatedSlash} / ${totalSlash} translated (${missingSlash.length} missing, ${emptySlash.length} empty)`)
console.log()

if (missingTitles.length > 0) {
  console.log("Missing title translations:")
  for (const [id, en] of missingTitles) console.log(`  ${id}: "${en}"`)
  console.log()
}
if (missingDescriptions.length > 0) {
  console.log("Missing description translations:")
  for (const id of missingDescriptions) console.log(`  ${id}`)
  console.log()
}
if (missingGroups.length > 0) {
  console.log("Missing group translations:")
  for (const g of missingGroups) console.log(`  ${g}`)
  console.log()
}
if (missingSlash.length > 0) {
  console.log("Missing slash command translations:")
  for (const s of missingSlash) console.log(`  ${s}`)
  console.log()
}

const issues = missingTitles.length + missingDescriptions.length + missingGroups.length + missingSlash.length
if (issues === 0) {
  console.log("✓ All translations present!")
  process.exit(0)
} else {
  console.log(`✗ ${issues} missing translations`)
  process.exit(1)
}