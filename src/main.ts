import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Platform, ItemView, WorkspaceLeaf } from "obsidian";

import child_process from "child_process";
import { Stream } from "stream";

import { Terminal } from "xterm";
import ObsidianTerminalSettingsTab, { DEFAULT_SETTINGS } from "./ObsidianTerminalSettingsTab";
import TerminalView from "./TerminalView";

export const VIEW_TYPE_NAME = "terminal";



export default class ObsidianTerminalPlugin extends Plugin {
    settings = DEFAULT_SETTINGS;

    async onload() {
        await this.loadSettings();

        // This adds a simple command that can be triggered anywhere
        this.addCommand({
            id: "open-obsidian-terminal",
            name: "Open Obsidian Terminal",
            callback: () => {
                this.openTerm();
            }
        });

        this.registerView(VIEW_TYPE_NAME, l=>{
            let term = new TerminalView(l);
            term.giveSettings(this.settings);
            return term;
        });

        
        this.addSettingTab(new ObsidianTerminalSettingsTab(this.app, this));

        console.log("Loaded Obsidian Terminal!");
        this.manifest.dir
    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async openTerm() {
        if(this.settings.allowMultipleTerminals == false) this.app.workspace.detachLeavesOfType(VIEW_TYPE_NAME);


        
        let termLeaf = this.app.workspace.createLeafBySplit(this.app.workspace.activeLeaf as WorkspaceLeaf, "horizontal", false);

        await termLeaf.setViewState({
            type: VIEW_TYPE_NAME,
            active: true
        });


        this.app.workspace.revealLeaf(termLeaf);

        if(this.settings.focusOnOpen) this.app.workspace.setActiveLeaf(termLeaf, {focus: true});
    }
}
