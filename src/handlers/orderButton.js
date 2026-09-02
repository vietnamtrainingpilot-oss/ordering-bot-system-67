const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const { COLORS, MODALS } = require('../config');
const logger = require('../utils/logger');

/**
 * Customer clicked "🌐 Order" in the order channel.
 *
 * Flow (Application-System style):
 *   1. Acknowledge the click in the server (ephemeral).
 *   2. DM the user.
 *   3. In the DM, show a "Start Your Order" button which opens the order
 *      modal (modal custom_id = ORDER_FORM).
 *
 * Modals CANNOT be opened directly from a server button click by the bot —
 * they must be triggered by an interaction in the same context. So we route
 * the user into a DM where a modal can be opened from a DM button.
 */
async function handleOrderButton(interaction) {
  const user = interaction.user;

  // Quick ack in the channel so the button click registers
  await interaction.reply({
    content: 'Opening your order form… check your DMs ✉️',
    ephemeral: true,
  });

  // Prevent duplicates / respect existing interactions (tracked in memory)
  if (interaction.client.orderLock?.has(user.id)) {
    return interaction
      .followUp({
        content: 'You already have an open order form. Check your DMs.',
        ephemeral: true,
      })
      .catch(() => {});
  }

  try {
    // Create the DM channel
    const dm = await user.createDM();

    if (!interaction.client.orderLock) {
      interaction.client.orderLock = new Set();
    }
    interaction.client.orderLock.add(user.id);

    const embed = new EmbedBuilder()
      .setColor(COLORS.BRAND)
      .setTitle('🚀 Let\'s Build Your Website')
      .setDescription(
        `Hi **${user.username}**, welcome to **PTC Web Service**!\n\n` +
          `Click **Start Your Order** below and fill out the form. This is where we collect your branding so our designer can build your site.\n\n` +
          `Everything you share in this DM is **private** — only our team sees your order.`
      )
      .setFooter({ text: 'Click Start Your Order to continue' });

    const startButton = new ButtonBuilder()
      .setCustomId('order_start')
      .setLabel('✏️ Start Your Order')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(startButton);

    await dm.send({ embeds: [embed], components: [row] });
  } catch (err) {
    logger.error(`Could not DM user ${user.id}:`, err.message);
    interaction.client.orderLock?.delete(user.id);
    await interaction
      .followUp({
        content:
          'I couldn\'t DM you — open your DMs (Settings → Privacy → Allow direct messages from server members) and try again.',
        ephemeral: true,
      })
      .catch(() => {});
  }
}

/**
 * User clicked "Start Your Order" in the DM → open the order modal.
 */
async function handleOrderStart(interaction) {
  const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } =
    require('discord.js');

  const modal = new ModalBuilder()
    .setCustomId(MODALS.ORDER_FORM)
    .setTitle('Website Order Form');

  const airlineName = new TextInputBuilder()
    .setCustomId('order_airline')
    .setLabel('Airline name')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. Pacific Sky Airlines')
    .setRequired(true);

  const groupLink = new TextInputBuilder()
    .setCustomId('order_group')
    .setLabel('PTFS group link')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://www.roblox.com/groups/…')
    .setRequired(true);

  const discordInvite = new TextInputBuilder()
    .setCustomId('order_discord')
    .setLabel('Discord invite link')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://discord.gg/…')
    .setRequired(true);

  const branding = new TextInputBuilder()
    .setCustomId('order_branding')
    .setLabel('Logo / brand colors')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(
      'Logo link + brand colors (hex). If none, type "design for me".'
    )
    .setRequired(false);

  const tone = new TextInputBuilder()
    .setCustomId('order_tone')
    .setLabel('Tone of the site')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('flag-carrier prestige / budget-friendly / cargo / charter…')
    .setRequired(true);

  const row1 = new ActionRowBuilder().addComponents(airlineName);
  const row2 = new ActionRowBuilder().addComponents(groupLink);
  const row3 = new ActionRowBuilder().addComponents(discordInvite);
  const row4 = new ActionRowBuilder().addComponents(branding);
  const row5 = new ActionRowBuilder().addComponents(tone);

  modal.addComponents(row1, row2, row3, row4, row5);

  await interaction.showModal(modal);
}

module.exports = { handleOrderButton, handleOrderStart };
