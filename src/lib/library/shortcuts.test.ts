import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { matchShortcut, rovingTarget, shortcutLabel, type ShortcutEvent } from "./shortcuts.ts";

const key = (patch: Partial<ShortcutEvent>): ShortcutEvent => ({
  key: "",
  code: "",
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...patch,
});

describe("matchShortcut", () => {
  it("uses ⌘ on Mac and Ctrl elsewhere for quick open", () => {
    assert.deepEqual(matchShortcut(key({ key: "k", code: "KeyK", metaKey: true }), true), {
      type: "quickOpen",
    });
    assert.deepEqual(matchShortcut(key({ key: "k", code: "KeyK", ctrlKey: true }), false), {
      type: "quickOpen",
    });
    assert.equal(matchShortcut(key({ key: "k", code: "KeyK", ctrlKey: true }), true), null);
  });

  it("splits right and down with the backslash key", () => {
    assert.deepEqual(matchShortcut(key({ key: "\\", code: "Backslash", metaKey: true }), true), {
      type: "splitRight",
    });
    assert.deepEqual(
      matchShortcut(key({ key: "|", code: "Backslash", metaKey: true, shiftKey: true }), true),
      {
        type: "splitDown",
      },
    );
  });

  it("finds the backslash key on ISO layouts like ABNT2", () => {
    // ABNT2 puts \ | on IntlBackslash; its Backslash position types ] }.
    assert.deepEqual(
      matchShortcut(key({ key: "\\", code: "IntlBackslash", ctrlKey: true }), false),
      {
        type: "splitRight",
      },
    );
    assert.deepEqual(
      matchShortcut(key({ key: "|", code: "IntlBackslash", ctrlKey: true, shiftKey: true }), false),
      { type: "splitDown" },
    );
    assert.equal(matchShortcut(key({ key: "]", code: "Backslash", ctrlKey: true }), false), null);
  });

  it("closes a tab with Alt+W and focuses panes with Alt+digits by key position", () => {
    assert.deepEqual(matchShortcut(key({ key: "∑", code: "KeyW", altKey: true }), true), {
      type: "closeTab",
    });
    assert.deepEqual(matchShortcut(key({ key: "™", code: "Digit2", altKey: true }), true), {
      type: "focusPane",
      index: 1,
    });
    assert.equal(matchShortcut(key({ code: "Digit7", altKey: true }), true), null);
  });

  it("moves between items with bare arrows only", () => {
    assert.deepEqual(matchShortcut(key({ key: "ArrowLeft", code: "ArrowLeft" }), true), {
      type: "prev",
    });
    assert.deepEqual(matchShortcut(key({ key: "ArrowRight", code: "ArrowRight" }), true), {
      type: "next",
    });
    assert.equal(
      matchShortcut(key({ key: "ArrowRight", code: "ArrowRight", shiftKey: true }), true),
      null,
    );
  });
});

describe("shortcutLabel", () => {
  it("prints the platform's modifiers", () => {
    assert.equal(shortcutLabel("quickOpen", true), "⌘K");
    assert.equal(shortcutLabel("quickOpen", false), "Ctrl+K");
    assert.equal(shortcutLabel("splitDown", true), "⇧⌘\\");
    assert.equal(shortcutLabel("closeTab", false), "Alt+W");
  });
});

describe("rovingTarget", () => {
  it("moves along a row of tabs with the arrows, wrapping at the ends", () => {
    assert.equal(rovingTarget("ArrowRight", 0, 3), 1);
    assert.equal(rovingTarget("ArrowRight", 2, 3), 0);
    assert.equal(rovingTarget("ArrowLeft", 0, 3), 2);
    assert.equal(rovingTarget("ArrowLeft", 2, 3), 1);
  });

  it("jumps to the first and last with Home and End", () => {
    assert.equal(rovingTarget("Home", 2, 3), 0);
    assert.equal(rovingTarget("End", 0, 3), 2);
  });

  it("ignores other keys and empty rows", () => {
    assert.equal(rovingTarget("ArrowDown", 0, 3), null);
    assert.equal(rovingTarget("Enter", 0, 3), null);
    assert.equal(rovingTarget("ArrowRight", 0, 0), null);
  });
});
