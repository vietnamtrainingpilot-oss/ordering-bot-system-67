const { SlashCommandBuilder } = require('discord.js');

/**
 * Registers slash commands for the bot.
 *
 * Slash commands are registered as GLOBAL (available in every guild the bot
 * is in) by default. If you only want them in ONE server, set GUILD_ID in
 * your .env and this will register guild-scoped commands instead (instant,
 * no propagation delay).
 */
async function registerCommands(client) {
  const commands = [
    new SlashCommandBuilder()
      .setName('setup-order')
      .setDescription(
        'Post the order button embed into the configured order channel'
      ),
  ];

  const data = commands.map((c) => c.toJSON());

  if (process.env.GUILD_ID) {
    // Guild-scoped (instant, per-server)
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) {
      throw new Error(`Guild ${process.env.GUILD_ID} not found`);
    }
    await guild.commands.set(data);
    return;
  }

  // Global registration (up to ~1 hour to propagate)
  await client.application.commands.set(data);
}

module.exports = { registerCommands };
