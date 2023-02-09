import { App, PluginSettingTab, Setting } from "obsidian";
import ObsidianTerminalPlugin from "./main";

const SETTINGS_SCHEMA = {
    terminalCommand: {
        name: "Terminal Command",
        desc: "The terminal command to use. Default: `powershell` on windows; `bash -i` otherwise",
        placeholder: "bash -i",
        default: "win32" ? "powershell" : "bash -i"
    },
    fontFamily: {
        name: "Terminal Font Family",
        desc: "The font family to use. Must be installed on the computer. If you want to use multiple fonts (e.g. for an emoji font), separate them with commas.",
        placeholder: "monospace",
        default: "'Fira Code', Cambria, monospace"
    },
    fontSize: {
        name: "Terminal Font Size",
        desc: "The font-size to use",
        placeholder: 12,
        default: 12
    },
    focusOnOpen: {
        name: "Focus terminal on open",
        desc: "Whether to focus the terminal pane when it opens",
        placeholder: true,
        default: true
    },
    allowMultipleTerminals: {
        name: "Allow multiple terminal panes",
        desc: "If this is checked, make a new terminal pane every time. This can get your workspace crowded fast.",
        placeholder: false,
        default: false
    },
    lineHeight: {
        name: "Terminal line height",
        desc: "The amount of space given to each line in the terminal. 1 means that each line gets 1 line's worth of space. 2 is double-spaced.",
        placeholder: 1.4,
        default: 1.4
    }
}

export type StyleSettings = {
    terminalCommand: string;
    fontFamily: string;
    fontSize: number;
    focusOnOpen: boolean;
    allowMultipleTerminals: boolean;
    lineHeight: number;
}

export const DEFAULT_SETTINGS = {
    terminalCommand: SETTINGS_SCHEMA.terminalCommand.default,
    fontFamily: SETTINGS_SCHEMA.fontFamily.default,
    fontSize: SETTINGS_SCHEMA.fontSize.default,
    focusOnOpen: SETTINGS_SCHEMA.focusOnOpen.default,
    allowMultipleTerminals: SETTINGS_SCHEMA.allowMultipleTerminals.default,
    lineHeight: SETTINGS_SCHEMA.lineHeight.default
}

export default class ObsidianTerminalSettingsTab extends PluginSettingTab {
    plugin: ObsidianTerminalPlugin;

    constructor(app: App, plugin: ObsidianTerminalPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl("h2", { text: "Obsidian Terminal settings" });
        containerEl.createEl("p", { text: "You must close and re-open the terminal pane for settings to take effect." });

        for (const key in SETTINGS_SCHEMA) {
            const schema = SETTINGS_SCHEMA[key];
            let setting = new Setting(containerEl)
                .setName(schema.name)
                .setDesc(schema.desc)

            switch (typeof schema.default) {
                case "string":
                    setting.addText(text => text
                        .setPlaceholder(schema.placeholder)
                        .setValue(this.plugin.settings[key])
                        .onChange(async (value) => {
                            this.plugin.settings[key] = value;
                            await this.plugin.saveSettings();
                        }));
                    break;
                case "boolean":
                    setting.addToggle(toggle => toggle
                        .setValue(this.plugin.settings[key])
                        .onChange(async (value) => {
                            this.plugin.settings[key] = value;
                            await this.plugin.saveSettings();
                        }));
                    break;
                case "number":
                    setting.addText(text => {
                        text.inputEl.type = "number";
                        text.inputEl.value = this.plugin.settings[key];

                        text.inputEl.addEventListener("input", async () => {

                            this.plugin.settings[key] = (+text.inputEl.value) || 0;
                            await this.plugin.saveSettings();
                        });
                    });
                    break;
            }
        }
    }
}