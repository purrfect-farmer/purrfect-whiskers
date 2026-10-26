# Example script

A Purrfect Whiskers script is a folder with a `package.json` and an entry file.

```
example/
  package.json   name, version, description, "type": "module", "main",
                 "whiskers": { "displayName", "icon" }
  icon.svg       optional; png, jpg, webp or svg up to 256 KB
  index.js       the entry file ("main", or index.js by default)
```

The entry file exports one async function. Whiskers calls it with the
selected accounts:

```js
export default async function (profiles) {
  for (const { account, session } of profiles) {
    // account: the Whiskers account (title, tags, proxy, telegramInitData…)
    // session: the account's Telegram session string
  }
}
```

- The script runs in its own Node.js process, with this folder as the
  working directory. Files it writes to `outputs/` stay next to it.
- Anything it prints shows in the Scripts log, with colours.
- There is no `npm install` on the user's machine: bundle any dependencies
  into the entry file (e.g. with esbuild) before sharing the script.
- To share a script, zip its folder. Others install it with **Install Script**.
