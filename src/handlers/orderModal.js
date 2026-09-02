const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
} = require('discord.js');
const { COLORS, MODALS } = require('../config');
const logger = require('../utils/logger');

// Store partial order data between modal steps (in memory).
// Key: user id → accumulated fields.
const orderDraft = new Map();

function getFields(interaction) {
  const values = {};
  for (const row of interaction.fields.fields.values()) {
    values[row.customId] = row.value;
  }
  return values;
}

/**
 * Route to the correct modal step. Called from index.js on any ORDER_FORM
 * submission. If the profile is "missing", it means this is the follow-up
 * modal (Step 2 / Step 3, same custom_id) — we detect by checking which
 * custom IDs are present.
 */
async function handleOrderModal(interaction) {
  const fields = getFields(interaction);
  const draft = orderDraft.get(interaction.user.id) || {};
  Object.assign(draft, fields);
  orderDraft.set(interaction.user.id, draft);

  const hasBranding = draft.order_branding !== undefined;

  // Step 1 submitted → go to Step 2
  if (hasBranding && draft.order_pages === undefined) {
    return showStepTwo(interaction, draft);
  }

  // Step 2 submitted → go to Step 3 (notes)
  if (draft.order_pages !== undefined && draft.order_notes === undefined) {
    return showStepThree(interaction, draft);
  }

  // Step 3 submitted → finalize order
  return finalizeOrder(interaction, draft);
}

function showStepTwo(interaction, draft) {
  const modal = new ModalBuilder()
    .setCustomId(MODALS.ORDER_FORM)
    .setTitle('Order Form — Step 2 of 3');

  const reference = new TextInputBuilder()
    .setCustomId('order_reference')
    .setLabel('1-2 airlines whose feel you want')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(
      'e.g. "Singapore Airlines" or "suggest options based on my tone"'
    )
    .setRequired(false);

  const pages = new TextInputBuilder()
    .setCustomId('order_pages')
    .setLabel('Pages you want')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(
      'Default: Home, Fleet, Routes, Careers, Join/Apply, News, Rules, Affiliates. List any you want added.'
    )
    .setRequired(true);

  const screenshots = new TextInputBuilder()
    .setCustomId('order_screenshots')
    .setLabel('Screenshots (in-game scenes)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(
      'Image URLs: Takeoff, Landing, Taxi, fleet… If none, type "none".'
    )
    .setRequired(false);

  const row1 = new ActionRowBuilder().addComponents(reference);
  const row2 = new ActionRowBuilder().addComponents(pages);
  const row3 = new ActionRowBuilder().addComponents(screenshots);

  modal.addComponents(row1, row2, row3);
  return interaction.showModal(modal);
}

function showStepThree(interaction, draft) {
  const modal = new ModalBuilder()
    .setCustomId(MODALS.ORDER_FORM)
    .setTitle('Order Form — Step 3 of 3');

  const notes = new TextInputBuilder()
    .setCustomId('order_notes')
    .setLabel('Anything else? (optional)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Extra info, deadlines, special requests…')
    .setRequired(false);

  const row1 = new ActionRowBuilder().addComponents(notes);
  modal.addComponents(row1);
  return interaction.showModal(modal);
}

async function finalizeOrder(interaction, draft) {
  // Deliver order to staff channel and DM the customer a confirmation
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } =
    require('discord.js');
  const config = require('../config');

  // Clear the draft lock
  interaction.client.orderLock?.delete(interaction.user.id);

  // Send confirmation to the customer's DM
  const confirmEmbed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('✅ Order Received!')
    .setDescription(
      `Thanks **${interaction.user.username}**! Your order for **${draft.order_airline}** has been submitted to our team.\n\n` +
        `📦 **Estimated delivery:** 48 hours to 1 week depending on current orders.\n` +
        `We'll update you here once your website is ready.`
    );

  await interaction.reply({ embeds: [confirmEmbed] });

  // Post to staff channel
  const staffChannelId = process.env.STAFF_CHANNEL_ID;
  if (!staffChannelId) {
    logger.warn('STAFF_CHANNEL_ID not configured — order not posted to staff.');
    return;
  }

  const staffChannel = interaction.client.channels.cache.get(staffChannelId);
  if (!staffChannel) {
    logger.warn(`Staff channel ${staffChannelId} not found in cache.`);
    return;
  }

  const pagesLabel = draft.order_pages || 'Home, Fleet, Routes, Careers, Join/Apply, News, Rules, Affiliates';
  const reference = draft.order_reference || 'Let us suggest';
  const screenshots = draft.order_screenshots || 'none yet';

  const orderEmbed = new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle('📦 New Website Order')
    .setDescription(`**Order from:** <@${interaction.user.id}>`)
    .addFields(
      { name: '✈️ Airline', value: draft.order_airline || '—', inline: true },
      { name: 'PTFS Group', value: draft.order_group || '—', inline: true },
      {
        name: 'Discord Invite',
        value: draft.order_discord || '—',
        inline: true,
      },
      { name: 'Branding & Colors', value: draft.order_branding || 'Design for me', inline: false },
      { name: 'Tone', value: draft.order_tone || '—', inline: true },
      { name: 'Reference Airlines', value: reference.slice(0, 1024), inline: true },
      { name: 'Screenshots', value: `\`\`\`\n${screenshots.slice(0, 900)}\n\`\`\``, inline: false },
      { name: 'Pages', value: pagesLabel.slice(0, 1024), inline: false },
      { name: 'Notes', value: (draft.order_notes || 'None').slice(0, 1024), inline: false }
    )
    .setTimestamp()
    .setFooter({ text: `Order by ${interaction.user.tag}` });

  const complete = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(config.STAFF_ACTION.COMPLETE)
      .setLabel('✅ Complete Order')
      .setStyle(ButtonStyle.Success)
  );
  const deny = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(config.STAFF_ACTION.DENY)
      .setLabel('❌ Deny')
      .setStyle(ButtonStyle.Danger)
  );
  const askMore = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(config.STAFF_ACTION.ASK_MORE)
      .setLabel('❓ Need More Info')
      .setStyle(ButtonStyle.Secondary)
  );

  await staffChannel.send({
    embeds: [orderEmbed],
    components: [complete, deny, askMore],
  });
}

module.exports = { handleOrderModal, orderDraft };
