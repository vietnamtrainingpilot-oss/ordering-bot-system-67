const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { COLORS, CUSTOMER_ACTION } = require('../config');

/**
 * Posts the customer-facing order banner into the configured channel.
 * This mirrors the JSON structure provided (banner image + content card +
 * the "🌐 Order" button).
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('discord.js').TextChannel} channel
 */
async function setupOrderEmbed(interaction, channel) {
  // Banner image (from the provided JSON)
  const banner =
    'https://media.discordapp.net/attachments/1544361777616265316/1544361851767488562/4.png?ex=6a98e34e&is=6a9791ce&hm=ad9fd0636a582e936c672400efe4f0afd4b307ff3986d79e483026a681170056&=&format=webp&quality=lossless&width=2048&height=512';

  const embed = new EmbedBuilder()
    .setColor(COLORS.BRAND)
    .setTitle('🌐 Order Your Website')
    .setDescription(
      `> Welcome to the ordering center, where you can request an order for your own website. You may follow the steps mentioned in <#${process.env.ORDER_CHANNEL_ID}>. Here is what we need to proceed your website:\n\n` +
        `- Airline name + PTFS group link\n` +
        `- Discord invite link\n` +
        `- Logo/brand colors — if you don't have these yet, tell me and I'll design them from a livery concept instead\n` +
        `- Tone: flag-carrier prestige, budget/friendly, cargo/charter, etc.\n` +
        `- 1-2 real airlines whose feel you want (or I'll suggest options based on your tone)\n` +
        `- Which pages you want (default: Home, Fleet, Routes, Careers, Join/Apply, News, Rules and Affiliates)\n` +
        `- Page contents for Home, Fleet, Routes, Careers, Join/Apply, News, Rules and Affiliates and other things\n` +
        `- Images of in-game scenes (like Takeoff, Landing, Taxi,...)\n\n` +
        `### Time\n` +
        `Your website will be delivered from around 48 hours to even a week based on the current orders.\n` +
        `### Rules when ordering\n` +
        `- You can only have 1 website\n` +
        `- You can't make multiple orders a time\n` +
        `- We have the right to deny on deliver your website if it violates our rules`
    )
    .setImage(banner);

  const orderButton = new ButtonBuilder()
    .setCustomId(CUSTOMER_ACTION.ORDER)
    .setLabel('🌐 Order')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(orderButton);

  await channel.send({ embeds: [embed], components: [row] });
  await interaction.reply({
    content: `Order embed posted in ${channel}.`,
    ephemeral: true,
  });
}

module.exports = { setupOrderEmbed };
