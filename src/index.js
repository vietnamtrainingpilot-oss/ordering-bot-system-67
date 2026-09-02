const { Client, GatewayIntentBits, Partials } = require('discord.js');
// dotenv is optional — on bot-hosting.net you use panel variables instead.
// `.config()` fails silently if no .env file exists, so this is safe either way.
try {
  require('dotenv').config();
} catch (_) {
  // dotenv not installed (e.g. deps trimmed) — rely on panel env vars
}

const config = require('./config');
const { handleOrderButton, handleOrderStart } = require('./handlers/orderButton');
const { handleOrderModal } = require('./handlers/orderModal');
const { handleStaffButton } = require('./handlers/staffButton');
const { handleCompleteModal } = require('./handlers/completeModal');
const { handleDenyModal } = require('./handlers/denyModal');
const { registerCommands } = require('./commands');
const { setupOrderEmbed } = require('./commands/setupOrder');
const logger = require('./utils/logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember,
  ],
});

// ------------------------- Bot lifecycle -------------------------

client.once('ready', async () => {
  logger.success(`Logged in as ${client.user.tag}`);

  try {
    await registerCommands(client);
    logger.info('Slash commands registered');
  } catch (err) {
    logger.error('Failed to register commands:', err.message);
  }

  const embed = client.channels?.cache.get(process.env.ORDER_CHANNEL_ID);
  logger.info(
    embed
      ? `Order channel loaded: #${embed.name}`
      : `Note: Order channel ID not found in cache (${process.env.ORDER_CHANNEL_ID}). It may load on first message.`
  );
});

// ------------------------- Interaction routing -------------------------

client.on('interactionCreate', async (interaction) => {
  try {
    // Slash command: /setup-order
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'setup-order') {
        return await handleSetupOrder(interaction);
      }
      return;
    }

    // Button: customer clicks "Order" or staff clicks Complete/Deny
    if (interaction.isButton()) {
      const { customId } = interaction;

      if (customId === config.CUSTOMER_ACTION.ORDER) {
        return await handleOrderButton(interaction);
      }

      if (customId === 'order_start') {
        return await handleOrderStart(interaction);
      }

      if (customId === config.STAFF_ACTION.COMPLETE) {
        return await handleStaffButton(interaction, 'complete');
      }

      if (customId === config.STAFF_ACTION.DENY) {
        return await handleStaffButton(interaction, 'deny');
      }

      if (customId === config.STAFF_ACTION.ASK_MORE) {
        return await handleStaffButton(interaction, 'ask_more');
      }

      logger.warn(`Unhandled button custom_id: ${customId}`);
      return;
    }

    // Modal submissions
    if (interaction.isModalSubmit()) {
      const { customId } = interaction;

      switch (customId) {
        case config.MODALS.ORDER_FORM:
          return await handleOrderModal(interaction);
        case config.MODALS.COMPLETE_FORM:
          return await handleCompleteModal(interaction);
        case config.MODALS.DENY_FORM:
          return await handleDenyModal(interaction);
        default:
          logger.warn(`Unhandled modal custom_id: ${customId}`);
          return;
      }
    }
  } catch (err) {
    logger.error('Error handling interaction:', err);
    // Log full stack for diagnosis
    console.error('FULL STACK:', err && err.stack);

    // Try to reply so the user isn't left hanging
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'Something went wrong. Please try again.',
          ephemeral: true,
        });
      }
    } catch (_) {
      // ignore - interaction may have timed out
    }
  }
});

async function handleSetupOrder(interaction) {
  // Restrict to staff/admin role if configured
  if (process.env.STAFF_ROLE_ID) {
    const staffRole = interaction.member?.roles?.cache?.has(process.env.STAFF_ROLE_ID);
    if (!staffRole && !interaction.member?.permissions?.has('Administrator')) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true,
      });
    }
  }

  if (!process.env.ORDER_CHANNEL_ID) {
    return interaction.reply({
      content: 'ORDER_CHANNEL_ID is not configured. Set it in your .env file.',
      ephemeral: true,
    });
  }

  const channel = interaction.guild?.channels.cache.get(process.env.ORDER_CHANNEL_ID);
  if (!channel) {
    return interaction.reply({
      content: 'Could not find the order channel. Check ORDER_CHANNEL_ID.',
      ephemeral: true,
    });
  }

  await setupOrderEmbed(interaction, channel);
}

// ------------------------- Start -------------------------

if (!process.env.DISCORD_TOKEN) {
  logger.error('DISCORD_TOKEN is missing. Create a .env file based on .env.example');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
