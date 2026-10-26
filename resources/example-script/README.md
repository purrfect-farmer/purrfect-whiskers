# Example script

A Purrfect Whiskers script is a folder with a `package.json` and an entry file.
This example uses every part of the scripts API, so it doubles as a guide:
run it, then read the files below.

```
example/
  package.json        name, version, description, "type": "module", "main",
                      "whiskers": { "displayName", "icon", "options" }
  icon.svg            optional; png, jpg, webp or svg up to 256 KB
  index.js            the entry file ("main", or index.js by default)
  lib/
    prompts.js        api.prompt: an image, a field, extra buttons, a timeout,
                      and a prompt about one account
    card.js           builds the SVG image shown in the prompt
    accounts.js       reads the Telegram user, proxy and backup size
    files.js          reads the files chosen in a file option
    runWithLimit.js   handles a few accounts at a time and stops on Stop
    report.js         saves the report as JSON or CSV to outputs/
```

### What it does

1. Prints its options. The manifest declares one of every option type:
   text, select, number, yes/no, file (several), folder, save, textarea and
   secret. The secret is printed masked.
2. Reads the files chosen in "Files to read" itself, with `fs`.
3. Reads the tag names with `api.getTags()`.
4. Asks for a note with `api.prompt()`, showing an image, a "No note"
   button and a 2-minute timeout.
5. Goes through the accounts a few at a time:
   - asks whether to keep an account that has no Telegram user
     (a prompt naming the account);
   - reads its session with `api.getSession()` and, if turned on, its full
     backup with `api.getBackup()`;
   - moves the progress bar with `api.progress()`.
6. Stops cleanly when you press Stop (`signal`), saving what was read.
7. Asks with `api.confirm()` before saving the report to the chosen
   folder (or `outputs/`), and a copy where "Also save a copy to" points.

## The entry file

The entry file exports one async function. Whiskers calls it with one
object, so new properties can be added later without breaking scripts:

```js
export default async function ({ accounts, options, api, signal }) {
  for (const account of accounts) {
    if (signal.aborted) break;

    const found = await api.getSession(account.partition);
    // found: { session, source: "local" | "web" }, or null
  }
}
```

- `accounts`: the selected Whiskers accounts (title, partition, tags,
  proxy, telegramInitData…).
- `options`: the values of the script's options, checked against their
  rules before the run starts.
- `api`: asks Whiskers for data or for input while the script runs.
- `signal`: an `AbortSignal`, aborted when the user presses Stop. The script
  has 5 seconds to clean up and return before it is ended; a second Stop
  ends it at once.

## `api`

| Call | Returns |
| --- | --- |
| `getSession(partition)` | `{ session, source }` or `null`. The Telegram string session, from the farmer's storage (`"local"`) or built from Telegram Web (`"web"`). Cached until the user forgets cached sessions. |
| `getBackup(partition)` | The account's full backup (storage, cookies…), read each time. |
| `getTags()` | The saved tags, `[{ id, name }]`. Accounts list tag ids. |
| `prompt({ title, … })` | `{ action, values }` when the user answers, or `null` when they cancel, the prompt times out or the run stops. See [Prompts](#prompts). |
| `confirm(title)` | `true` when the user continues, `false` when they cancel. |
| `progress(done, total)` | Nothing; shows a progress bar above the output. |

`getSession` and `getBackup` only read the accounts the script runs on.
Reading an account opens it in the background, so the selected accounts are
closed while the script runs.

## Prompts

A prompt asks the user for input while the script runs, e.g. to solve a
captcha. Prompts from several accounts wait in a queue, oldest first.

```js
const answer = await api.prompt({
  title: "Solve the captcha",
  description: "Type the characters in the image",
  partition: account.partition,
  image: captchaBase64,
  timeout: 60,
  actions: [{ value: "refresh", label: "New image" }],
  fields: [{ key: "code", type: "text", label: "Code", required: true }],
});

if (!answer) return; // cancelled, timed out or stopped
if (answer.action === "refresh") {
  // fetch a new image and ask again
}
console.log(answer.values.code); // answer.action === "submit"
```

| Property | Meaning |
| --- | --- |
| `title`, `description` | What the user is asked. |
| `partition` | The account the prompt is about; its title is shown. |
| `image` | A PNG, JPEG, WebP or GIF as a data URL or plain base64, or an SVG as a data URL (base64 or URL-encoded), up to 2 million characters. |
| `fields` | The inputs, in the option format below. |
| `actions` | Up to 3 extra buttons, as strings or `{ value, label }`. They answer without checking the fields. |
| `timeout` | Seconds (5–3600) before the prompt closes by itself with `null`. |

Submit answers with `action: "submit"` once every field is valid.

## Options

Options are declared under `"whiskers"` in `package.json`. Whiskers shows
them above the output, remembers the last values for each script (except
secrets) and checks them before every run.

```json
"options": [
  { "key": "limit", "type": "number", "label": "Limit", "min": 1, "max": 50, "default": 10 },
  { "key": "mode", "type": "select", "label": "Mode", "required": true,
    "choices": [{ "value": "fast", "label": "Fast" }, "careful"] },
  { "key": "dryRun", "type": "boolean", "label": "Dry run", "default": true },
  { "key": "message", "type": "textarea", "label": "Message" },
  { "key": "apiKey", "type": "secret", "label": "API key", "required": true },
  { "key": "input", "type": "file", "label": "Accounts list", "extensions": ["csv"] },
  { "key": "photos", "type": "file", "label": "Photos", "multiple": true },
  { "key": "outDir", "type": "folder", "label": "Save reports to" },
  { "key": "export", "type": "save", "label": "Export to", "defaultName": "export.csv" }
]
```

| Property | Meaning |
| --- | --- |
| `key` | The name in `options`; letters, digits and `_`. |
| `type` | `text`, `textarea`, `number`, `boolean`, `select`, `secret`, `file`, `folder` or `save`. |
| `label`, `description`, `placeholder` | What the user sees. |
| `required` | The field can't be left empty. |
| `default` | The starting value. |
| `min`, `max` | The range of a `number`, which is always a whole number. |
| `choices` | The values of a `select`: strings or `{ value, label }`. |
| `extensions` | The file types a `file` or `save` field accepts, e.g. `["csv", "txt"]`. |
| `multiple` | A `file` field takes several files; its value is a list of paths. |
| `defaultName` | The file name a `save` field suggests. |

Text is trimmed, except secrets. Secrets are masked and never remembered.
Fields with an unknown type or an invalid key are left out.

### File, folder and save fields

Their value is a full path (or a list of paths), chosen with the system
dialog or by dropping files onto the field. The script reads or writes the
path itself with `fs`. Before a run, and before a prompt's answer reaches the
script, Whiskers checks that a `file` exists and is a file, a `folder`
exists and is a folder, and the folder a `save` path goes in exists. Paths
are remembered like other options. The same field types work in
`api.prompt`, e.g. to ask for a file in the middle of a run.

## Running and sharing

- The script runs in its own Node.js process, with this folder as the
  working directory. Files it writes to `outputs/` stay next to it.
- Anything it prints shows in the Scripts log, with colours.
- There is no `npm install` on the user's machine: bundle any dependencies
  into the entry file (e.g. with esbuild) before sharing the script.
- To share a script, zip its folder. Others install it with **Install Script**.
