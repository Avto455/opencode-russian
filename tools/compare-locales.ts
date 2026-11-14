/**
 * Compare two locale packs to find differences.
 * Usage: bun tools/compare-locales.ts --base zh-Hans --target ru
 */

import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const args = process.argv.slice(2)
function opt(name: string) {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const BASE = opt("base") ?? "zh-Hans"
const TARGET = opt("target") ?? "ru"
const V2_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..")

// Use the original opencode-i18n project for base locale comparison
const ORIGINAL_I18N_ROOT = "D:\\project\\opencode-i18n"
const baseFile = path.join(ORIGINAL_I18N_ROOT, "i18n", "locales", `${BASE}.json`)
const targetFile = path.join(V2_ROOT, "i18n", "locales", `${TARGET}.json`)

const base = JSON.parse(readFileSync(baseFile, "utf8"))
const target = JSON.parse(readFileSync(targetFile, "utf8"))

console.log(`=== Comparing ${BASE} (base from opencode-i18n) vs ${TARGET} (target) ===`)
console.log()

// Commands
const baseCmdIds = new Set(Object.keys(base.commands))
const targetCmdIds = new Set(Object.keys(target.commands))

const onlyInBase = [...baseCmdIds].filter(id => !targetCmdIds.has(id))
const onlyInTarget = [...targetCmdIds].filter(id => !baseCmdIds.has(id))
const inBoth = [...baseCmdIds].filter(id => targetCmdIds.has(id))

console.log(`Commands in ${BASE} only: ${onlyInBase.length}`)
console.log(`Commands in ${TARGET} only: ${onlyInTarget.length}`)
console.log(`Commands in both: ${inBoth.length}`)
console.log()

if (onlyInBase.length > 0) {
  console.log(`Only in ${BASE}:`)
  for (const id of onlyInBase.sort()) console.log(`  ${id}`)
  console.log()
}
if (onlyInTarget.length > 0) {
  console.log(`Only in ${TARGET}:`)
  for (const id of onlyInTarget.sort()) console.log(`  ${id}`)
  console.log()
}

// Title variants comparison for common commands
let variantDiffs = 0
for (const id of inBoth) {
  const baseTitles = new Set(Object.keys(base.commands[id].titles))
  const targetTitles = new Set(Object.keys(target.commands[id].titles))
  const missingInTarget = [...baseTitles].filter(t => !targetTitles.has(t))
  const extraInTarget = [...targetTitles].filter(t => !baseTitles.has(t))
  if (missingInTarget.length > 0 || extraInTarget.length > 0) {
    variantDiffs++
    console.log(`Command ${id} title variants differ:`)
    if (missingInTarget.length > 0) console.log(`  Missing in ${TARGET}: ${missingInTarget.join(", ")}`)
    if (extraInTarget.length > 0) console.log(`  Extra in ${TARGET}: ${extraInTarget.join(", ")}`)
  }
}
console.log(`Commands with variant differences: ${variantDiffs}`)
console.log()

// Groups
const baseGroups = new Set(Object.keys(base.groups))
const targetGroups = new Set(Object.keys(target.groups))
const groupsOnlyInBase = [...baseGroups].filter(g => !targetGroups.has(g))
const groupsOnlyInTarget = [...targetGroups].filter(g => !baseGroups.has(g))
console.log(`Groups in ${BASE} only: ${groupsOnlyInBase.length}`)
console.log(`Groups in ${TARGET} only: ${groupsOnlyInTarget.length}`)
if (groupsOnlyInBase.length > 0) console.log(`  ${groupsOnlyInBase.join(", ")}`)
if (groupsOnlyInTarget.length > 0) console.log(`  ${groupsOnlyInTarget.join(", ")}`)
console.log()

// Slash commands
const baseSlash = new Set(Object.keys(base.slash_commands))
const targetSlash = new Set(Object.keys(target.slash_commands))
const slashOnlyInBase = [...baseSlash].filter(s => !targetSlash.has(s))
const slashOnlyInTarget = [...targetSlash].filter(s => !baseSlash.has(s))
console.log(`Slash commands in ${BASE} only: ${slashOnlyInBase.length}`)
console.log(`Slash commands in ${TARGET} only: ${slashOnlyInTarget.length}`)
if (slashOnlyInBase.length > 0) console.log(`  ${slashOnlyInBase.join(", ")}`)
if (slashOnlyInTarget.length > 0) console.log(`  ${slashOnlyInTarget.join(", ")}`)