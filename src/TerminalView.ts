import { spawn } from "child_process";
import { ItemView } from "obsidian";
import { Stream } from "stream";
import { Terminal } from "xterm";
import { VIEW_TYPE_NAME } from "./main";
import { StyleSettings } from "./ObsidianTerminalSettingsTab";
import { debounce, getCssVarColor } from "./util";
import { loadXtermCss } from "./xterm-css";

export default class TerminalView extends ItemView {
    constructor(leaf) {
        super(leaf);
    }
    /** @type {StyleSettings} */
    settings: StyleSettings;


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

        sizeUpContent(content, this.settings);
        this.terminal = attachTerminal(content, vaultPath, shell, this.settings);

        content.tabIndex = 0;
        if (this.settings.focusOnOpen) content.focus();
    }
    async onClose() {
        this.terminal.kill();
    }

    async onResize() {
        this.terminal.onResize();
    }
}

function resizeTerminal(xterm, parent) {
    const core = xterm._core;
    const heightPx = parent.clientHeight;
    const widthPx = parent.clientWidth;

    const cols = Math.floor(widthPx / core._renderService.dimensions.actualCellWidth);
    const rows = Math.floor(heightPx / core._renderService.dimensions.actualCellHeight);

    xterm.resize(cols, rows);
}

function calculateRowHeight(height, styleSettings) {
    return Math.floor(height / (styleSettings.fontSize * styleSettings.lineHeight) / 2);
}


/**
 * 
 * @param {HTMLElement} containerElement
 */
function makeTitleTransparent(containerElement) {
    let titleContainer = containerElement.getElementsByClassName("view-header-title-container")[0];
    titleContainer.style.opacity = "0";

    let viewHeader = containerElement.getElementsByClassName("view-header")[0];
    viewHeader.setAttribute("style", "pointer-events:none;background-color: transparent !important");

    let viewActions = viewHeader.getElementsByClassName("view-actions")[0];
    viewActions.setAttribute("style", "pointer-events:auto;background-color: transparent !important");

    let viewMoveIcon = viewHeader.getElementsByClassName("view-header-icon")[0];
    viewMoveIcon.style.pointerEvents = "auto";
}

/**
 * 
 * @param {HTMLElement} parent 
 * @param {string} cwd
 * @param {string} shellCmd
 * @param {StyleSettings} styleSettings
 */
function attachTerminal(parent, cwd, shellCmd, styleSettings) {

    loadXtermCss();

    let xterm = new Terminal({
        convertEol: true,
        fontFamily: styleSettings.fontFamily,
        fontSize: styleSettings.fontSize,
        lineHeight: styleSettings.lineHeight,
        allowTransparency: true,
        rendererType: "dom",
        customGlyphs: true,
        theme: {
            foreground: getCssVarColor("--text-normal"),
            background: getCssVarColor("--background-secondary-alt"),
            selection: getCssVarColor("--text-selection"),

            cursor: getCssVarColor("--text-normal"),
            cursorAccent: getCssVarColor("--text-normal"),

            red: getCssVarColor("--red"),
            green: getCssVarColor("--green"),
            yellow: getCssVarColor("--yellow"),
            blue: getCssVarColor("--blue"),
            magenta: getCssVarColor("--purple"),
            cyan: getCssVarColor("--cyan")
        }
    });
    xterm.open(parent);

    setTimeout(function () {
        resizeTerminal(xterm, parent);
    }, 100);


    let termStream = childShell(cwd, shellCmd);

    termStream.on("data", function (data) {
        xterm.write(data);
    });

    xterm.onData(function (data) {
        termStream.write(data);
    });

    setTimeout(function () {
        resizeTerminal(xterm, parent);
    }, 100);

    return {
        kill: function () {
            xterm.dispose()
        },
        onResize: debounce(function () {
            resizeTerminal(xterm, parent);
        })
    };
}

function childShell(cwd, shellCmd) {
    let shargs = parseCmd(shellCmd);

    let shell = spawn(shargs[0], shargs.slice(1), {
        cwd: cwd,
        shell: false,
        windowsHide: true
    });
    var stream = new Stream.Duplex({
        write: function (chunk, encoding, next) {
            shell.stdin.write(chunk, encoding, next);
        },
        read: function (size) {

        }
    });

    shell.stdout.on("data", d => stream.push(d));
    shell.stderr.on("data", d => stream.push(d));

    stream.on("close", function () {
        shell.kill();
    })

    return stream;
}

function sizeUpContent(contentElement, styleSettings) {

    contentElement.setAttribute("style", `
        position: absolute;
        top: 0;
        bottom: 0;
        height: 100%;
        white-space: pre-wrap;
        user-select: all;
        contain: strict;
        overflow: hidden;
        `);


}

function getVaultPath(vault) {
    if (vault.adapter) return vault.adapter.getBasePath();
    else return "";
}



/**
 * 
 * @param {string} cmd 
 * @returns string[]
 */
function parseCmd(cmd) {
    let inDblQuotes = false;
    let inSngQuotes = false;

    let words: string[] = [];
    let word = "";

    for (const char of cmd) {
        if (char == "\"") inDblQuotes = !inDblQuotes;
        if (char == "'") inSngQuotes = !inSngQuotes;

        word += char;

        if (!inDblQuotes && !inSngQuotes && char == " ") {
            if (word != "") words.push(dequote(word));
            word = "";
        }
    }

    if (word != "") words.push(dequote(word));

    return words;
}

function dequote(w: string): string {
    let wTrim = w.trim();

    if (wTrim.startsWith("\"") || wTrim.startsWith("'")) wTrim = wTrim.slice(1);
    if (wTrim.endsWith("\"") || wTrim.endsWith("'")) wTrim = wTrim.slice(0, -1);

    return wTrim;
}

