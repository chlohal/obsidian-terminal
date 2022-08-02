# Obsidian Terminal

I *love* [Obsidian](https://obsidian.md). It's amazing to have a note-taking software that lets me work how I want to.

The only shortcoming of Obsidian is its Git integrations. There's a plugin, but I *really* prefer the terminal. And besides, having a terminal integration lets you do *everything!*

So I made this quick-and-dirty Obsidian Terminal :)

## Installing

If you have `git`, then you can clone this repository to your `.obsidian/plugins` folder.

If you don't have git, then click the green "Code" button, then click "Download ZIP". Extract the `.zip` folder to the `.obsidian/plugins` folder inside your vault.

The folder structure should look like this:

```

<vault>
├─ .obsidian
│  ├─ obsidian-terminal
│  │  ├─ main.js
│  │  ├─ manifest.json
│  │  ├─ versions.json
│  │  └─ ..
│  └ ...other plugins...
└ ...note files...
```

After copying the files, restart Obsidian and it should work!

## Tools Used

**You don't need any dependencies. This section is only included to give credit to the projects that made this possible**

- [xterm.js](https://github.com/xtermjs/xterm.js)

## Development

No build system necessary-- no typescript; no `npm run dev`. 

~~no `require()` either because of how obsidian 'loads' plugins, but  that's okay~~