const { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Platform, ItemView, WorkspaceLeaf } = require("obsidian");

const process = require("process");

const child_process = require("child_process");

const VIEW_TYPE_NAME = "terminal";

const DEFAULT_SETTINGS = {
    terminalCommand: process.platform == "win32" ? "powershell" : "bash -i"
}


module.exports = class ObsidianTerminalPlugin extends Plugin {
    settings = DEFAULT_SETTINGS;

    async onload() {
        await this.loadSettings();

        // This adds a simple command that can be triggered anywhere
        this.addCommand({
            id: 'open-obsidian-terminal',
            name: 'Open Obsidian Terminal',
            callback: () => {
                this.openTerm();
            }
        });

        this.registerView(VIEW_TYPE_NAME, l=>{
            let term = new TerminalView(l);
            term.giveSettings(this.settings);
            return term;
        });

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new SampleSettingTab(this.app, this));
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
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_NAME);



        let wsSplit = this.app.workspace.rootSplit;
        //let termLeaf = this.app.workspace.getLeaf(true);

        let termLeaf = this.app.workspace.createLeafBySplit(this.app.workspace.activeLeaf, "horizontal", false);

        await termLeaf.setViewState({
            type: VIEW_TYPE_NAME,
            active: true
        });


        this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_NAME)[0]);
    }
}

function getVaultPath(vault) {
    if(vault.adapter) return vault.adapter.getBasePath();
    else return "";
}

class SampleSettingTab extends PluginSettingTab {
    plugin;

    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Obsidian Terminal settings' });

        new Setting(containerEl)
            .setName('Terminal')
            .setDesc('The terminal command to use. Default: `powershell` on windows; `bash -i` otherwise ')
            .addText(text => text
                .setPlaceholder('Enter your secret')
                .setValue(this.plugin.settings.terminalCommand)
                .onChange(async (value) => {
                    this.plugin.settings.mySetting = value;
                    await this.plugin.saveSettings();
                }));
    }
}



class TerminalView extends ItemView {
    constructor(leaf) {
        super(leaf);
    }
    settings;
    terminal;

    giveSettings(settings) {
        this.settings = settings;
    }

    getIcon() { return "code-glyph" }
    getViewType() { return VIEW_TYPE_NAME; }
    getDisplayText() { return "Terminal"; }

    async onOpen() {
        makeTitleTransparent(this.containerEl);
        let content = this.contentEl;

        let vaultPath = getVaultPath(this.app.vault);
        let shell = this.settings.terminalCommand;

        sizeUpContent(content);
        this.terminal = attachTerminal(content, vaultPath, shell);
    }
    async onClose() {        
        this.terminal.kill();
    }
}

/**
 * 
 * @param {HTMLElement} parent 
 */
function attachTerminal(parent, cwd, shellCmd) {
    let shell = childShell(cwd, shellCmd);

    let istreams = parent.createSpan();

    let stdout = addTextNodeTo(istreams);
    let stderr = addTextNodeTo(istreams);

    let stdin = addStdin(parent);

    let lastStreamOut = stdout;

    shell.stdout.on("data", function(data) {
        let dock = isDockedAtBottom(parent);

        if(lastStreamOut != stdout) lastStreamOut = stdout = addTextNodeTo(istreams);
        lastStreamOut.textContent += data;

        if(dock) parent.scrollTop = parent.scrollHeight + parent.clientHeight;
    });
    shell.stderr.on("data", function(data) {
        let dock = isDockedAtBottom(parent);

        if(lastStreamOut != stderr) lastStreamOut = stderr = addTextNodeTo(istreams);
        lastStreamOut.textContent += data;

        if(dock) parent.scrollTop = parent.scrollHeight + parent.clientHeight;
    });

    stdin.addEventListener("beforeinput", function(e) {
        if(e.inputType == "insertParagraph") {
            shell.stdin.write(stdin.textContent + "\n");
            stdin.textContent = "";
            e.preventDefault();
        }
    });

    return shell;
}

function isDockedAtBottom(elem) {
    return Math.abs(elem.scrollTop - (elem.scrollHeight - elem.clientHeight)) < 4;
}

function addTextNodeTo(parent) {
    var spn = parent.createSpan();
    spn.textContent = ".";
    let node = spn.childNodes[0];
    node.textContent = "";
    return node;
}

function addStdin(parent) {
    let stdin = parent.createSpan();
    stdin.contentEditable = true;
    stdin.tabIndex = 0;

    parent.addEventListener("click", ()=>stdin.focus());
    parent.addEventListener("focus", ()=>stdin.focus());

    stdin.setAttribute("style", `caret-shape: block;`);

    return stdin;
}

function childShell(cwd, shellCmd) {
    let shell = child_process.exec(shellCmd, {
        cwd: cwd
    });

    return shell;
}

function sizeUpContent(contentElement) {
    
    contentElement.setAttribute("style", `
        position: absolute;
        top: 0;
        bottom: 0;
        height: 100%;
        padding: 1em 0.75em;
        background: var(--background-secondary-alt);
        white-space: pre;
        user-select: all;
        cursor: text;`);
    
    
}

/**
 * 
 * @param {HTMLElement} containerElement
 */
function makeTitleTransparent(containerElement) {
    let titleContainer = containerElement.getElementsByClassName("view-header-title-container")[0];
    titleContainer.style.opacity = "0";
    
    let viewHeader = containerElement.getElementsByClassName("view-header")[0];
    viewHeader.setAttribute("style", "background-color: #0000 !important");

    let viewActions = viewHeader.getElementsByClassName("view-actions")[0];
    viewActions.style.backgroundColor = "#0000";
}