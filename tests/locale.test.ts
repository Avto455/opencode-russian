import { describe, it, expect } from "bun:test"
import { readFileSync } from "node:fs"
import path from "node:path"

const LOCALES_DIR = path.join(process.cwd(), "i18n", "locales")

function loadLocale(locale: string) {
  return JSON.parse(readFileSync(path.join(LOCALES_DIR, `${locale}.json`), "utf8"))
}

describe("Locale packs", () => {
  const ruLocale = loadLocale("ru")
  const enLocale = loadLocale("en")

  it("has required top-level fields", () => {
    expect(ruLocale).toHaveProperty("name")
    expect(ruLocale).toHaveProperty("language_picker")
    expect(ruLocale).toHaveProperty("commands")
    expect(ruLocale).toHaveProperty("groups")
    expect(ruLocale).toHaveProperty("slash_commands")
  })

  it("has valid language_picker structure", () => {
    expect(ruLocale.language_picker).toHaveProperty("question")
    expect(ruLocale.language_picker).toHaveProperty("option_descriptions")
    expect(typeof ruLocale.language_picker.question).toBe("string")
    expect(ruLocale.language_picker.question.length).toBeGreaterThan(0)
    expect(ruLocale.language_picker.option_descriptions).toHaveProperty("en")
    expect(ruLocale.language_picker.option_descriptions).toHaveProperty("ru")
  })

  it("has non-empty name", () => {
    expect(ruLocale.name).toBe("Русский")
  })

  it("has commands with titles and optional descriptions", () => {
    for (const [id, cmd] of Object.entries(ruLocale.commands)) {
      expect(typeof id).toBe("string")
      expect(id.length).toBeGreaterThan(0)
      expect(cmd).toHaveProperty("titles")
      expect(typeof cmd.titles).toBe("object")
      // At least one title should be translated
      const hasTranslation = Object.values(cmd.titles).some(t => t && t.trim().length > 0)
      expect(hasTranslation).toBe(true)
      if (cmd.description) {
        expect(typeof cmd.description).toBe("string")
      }
    }
  })

  it("has groups with translations", () => {
    for (const [en, ru] of Object.entries(ruLocale.groups)) {
      expect(typeof en).toBe("string")
      expect(typeof ru).toBe("string")
      expect(ru.trim().length).toBeGreaterThan(0)
    }
  })

  it("has slash_commands with translations", () => {
    for (const [slash, ru] of Object.entries(ruLocale.slash_commands)) {
      expect(typeof slash).toBe("string")
      expect(slash.startsWith("/")).toBe(true)
      expect(typeof ru).toBe("string")
      expect(ru.trim().length).toBeGreaterThan(0)
    }
  })

  it("en.json has empty commands as fallback", () => {
    expect(Object.keys(enLocale.commands).length).toBe(0)
    expect(Object.keys(enLocale.groups).length).toBe(0)
    expect(Object.keys(enLocale.slash_commands).length).toBe(0)
  })

  it("contains expected core commands", () => {
    const expectedCommands = [
      "session.new",
      "session.list",
      "session.sidebar.toggle",
      "session.interrupt",
      "agent.list",
      "model.list",
      "command.palette.show",
      "help.show",
      "opencode.settings",
      "plugins.list",
    ]
    for (const id of expectedCommands) {
      expect(Object.prototype.hasOwnProperty.call(ruLocale.commands, id)).toBe(true)
    }
  })

  it("contains expected core groups", () => {
    const expectedGroups = [
      "Agent",
      "Session",
      "Model",
      "Theme",
      "System",
      "Terminal",
      "Permission",
    ]
    for (const group of expectedGroups) {
      expect(Object.prototype.hasOwnProperty.call(ruLocale.groups, group)).toBe(true)
    }
  })

  it("contains expected slash commands", () => {
    const expectedSlash = [
      "/new",
      "/agents",
      "/models",
      "/themes",
      "/settings",
      "/help",
      "/exit",
      "/share",
      "/terminal",
      "/diff",
    ]
    for (const slash of expectedSlash) {
      expect(Object.prototype.hasOwnProperty.call(ruLocale.slash_commands, slash)).toBe(true)
    }
  })
})