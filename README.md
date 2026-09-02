# PTC Order Bot

Discord bot that handles **website orders** for PTC Web Service — from a button
click in the order channel, through DM-based intake, to staff approval and
customer delivery.

## Flow

```
Customer clicks 🆇 Order (in order channel)
        │
        ▼
Bot DMs customer with "Start Your Order" button
        │
        ▼
3-step modal form (DM) collects branding:
  Step 1: airline, group link, discord invite, branding, tone
  Step 2: reference airlines, pages, screenshots
  Step 3: notes
        │
        ▼
Order posted to STAFF channel with buttons
        │
        ├── ✅ Complete → modal: website link + admin password
        │        → DM customer the delivery details
        │        → staff card marked completed
        │
        ├── ❌ Deny → modal: reason → DM customer
        │
        └── ❓ Need More Info → DMs customer for details
```

## Setup

### 1. Prerequisites

- Node.js **18+**
- A Discord bot application + token
- The bot invited with these permissions:
  - **Send Messages**, **Embed Links**, **Attach Files**, **Read Message History**
  - **Manage Webhooks** / **Manage Messages** (to edit completed cards)
  - **Direct Messages** permission enabled for the bot

### 2. Install dependencies

```bash
npm install
```

### 3. Configure

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | ✅ | Your bot token |
| `ORDER_CHANNEL_ID` | ✅ | Channel where customers click 🆇 Order |
| `STAFF_CHANNEL_ID` | ✅ | Channel where staff manage orders |
| `STAFF_ROLE_ID` | ✅ | Role allowed to complete/deny orders |
| `GUILD_ID` | Optional | Restrict slash commands to one server |
| `PREFIX` | Optional | Fallback text prefix (not used by default) |

### 4. Run

```bash
npm start
```

### 5. Post the order embed

In the server, run:

```
/setup-order
```

This posts the branded order banner + the 🆇 Order button into the configured
`ORDER_CHANNEL_ID`. Run it again any time you need to repost it.

> **Note:** If you already have an order embed (e.g. the JSON you provided),
> you can skip `/setup-order` and just add a button with `custom_id`
> `p_342161678223282177` — the bot already listens for that exact ID.

---

## Custom Fields

The order form fields are defined in `src/handlers/orderModal.js`. The form
is split into 3 modals (Discord caps modals at 5 inputs each). To add/remove
fields, edit the `TextInputBuilder` blocks and the `orderEmbed.addFields`
section.

Staff action buttons are defined in `src/config.js` under `STAFF_ACTION`.

## Notes

- Order data is held **in memory** (`orderDraft` map). Restarting the bot
  loses unfinished drafts but not delivered orders (those live in the staff
  channel).
- The `orderLock` Set prevents a single customer from opening multiple forms
  at once. It clears when they finish (or if the order times out).
- Delivery DMs include a link button to the live website plus the admin
  password.

---

## Deploying on bot-hosting.net

The **new** bot-hosting.net panel has **no shell access** and does **not**
support running `npm install` / `npm start` in a console. You configure the
deployment in the panel instead.

### 1. Create the server

- In the bot-hosting.net dashboard, **Create Server**.
- Set **Language/Runtime** to **Node.js**.
- Free plan gives 256 MB RAM / 512 MB storage — plenty for this bot.

### 2. Upload your files

Do **NOT** upload your local `node_modules` folder (bot-hosting.net handles
installing deps, and uploading it wastes storage / can break paths).

Upload only the project files:

```
package.json
package-lock.json      (recommended - locks versions)
src/
    index.js
    config.js
    commands/
    handlers/
    utils/
```

Either use the **Files** tab or **SFTP** (credentials in the SFTP tab). If you
upload a ZIP, you can use the Files tab to unarchive it.

### 3. Configure startup

In the **Startup** tab:

- **Entry File (STARTUP_FILE):** `src/index.js`
- Leave the node/npm install settings at their defaults — bot-hosting.net runs
  `npm install` automatically on start using your `package.json`.

### 4. Set environment variables (instead of `.env`)

In the **Startup / Variables** tab, add each variable (this replaces the local
`.env` file):

| Variable            | Value                                |
|---------------------|--------------------------------------|
| `DISCORD_TOKEN`     | your bot token                       |
| `ORDER_CHANNEL_ID`  | channel where customers click Order  |
| `STAFF_CHANNEL_ID`  | channel where staff manage orders    |
| `STAFF_ROLE_ID`     | role allowed to complete/deny        |
| `GUILD_ID`          | your server ID (for instant commands)|
| `PREFIX`            | `!` (optional)                       |

Set `GUILD_ID` so `/setup-order` registers instantly. Without it, global
registration can take up to an hour.

### 5. Start

Click **Start** and watch the **Console** tab. You should see:

```
✔ Logged in as <botname>
ℹ Slash commands registered
```

Then in Discord run `/setup-order` to post the order embed.

### Troubleshooting on bot-hosting.net

- **`Error: Cannot find module 'discord.js'`** → `package.json` wasn't picked
  up or deps failed to install. Re-check the Entry File and that
  `package.json` is at the project root.
- **`TokenInvalid` / `Invalid token`** → re-check `DISCORD_TOKEN` in the
  Startup/Variables tab.
- **Slash command not appearing** → restart the bot, and/or confirm `GUILD_ID`
  is set.
- **Console shows nothing** → confirm the Entry File path is exactly
  `src/index.js`.
