// Minimal colored logger for the bot.

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

function ts() {
  return new Date().toLocaleTimeString();
}

const logger = {
  info: (msg) => console.log(`${CYAN}${ts()}${RESET} ℹ ${msg}`),
  success: (msg) => console.log(`${GREEN}${ts()}${RESET} ✔ ${msg}`),
  warn: (msg) => console.log(`${YELLOW}${ts()}${RESET} ⚠ ${msg}`),
  error: (msg, err) =>
    console.error(`${RED}${ts()}${RESET} ✖ ${msg}${err ? ' :: ' + err : ''}`),
  debug: (msg) => {
    if (process.env.DEBUG) {
      console.log(`${BLUE}${ts()}${RESET} 🐛 ${msg}`);
    }
  },
};

module.exports = logger;
