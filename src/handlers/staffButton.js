const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { MODALS } = require('../config');

/**
 * Staff clicked a management button on an order card.
 *
 *   "complete" → opens modal asking for website link + admin password
 *   "deny"     → opens modal asking for a reason
 *   "ask_more" → sends a DM to the customer asking for more info
 *
 * All three keep a reference to the original staff message, so we can update
 * the card after the flow finishes.
 */
async function handleStaffButton(interaction, action) {
  // Permission check
  if (process.env.STAFF_ROLE_ID) {
    const hasRole = interaction.member?.roles?.cache?.has(
      process.env.STAFF_ROLE_ID
    );
    const isAdmin = interaction.member?.permissions?.has('Administrator');
    if (!hasRole && !isAdmin) {
      return interaction.reply({
        content: 'You don\'t have permission to manage orders.',
        ephemeral: true,
      });
    }
  }

  switch (action) {
    case 'complete':
      return openCompleteModal(interaction);
    case 'deny':
      return openDenyModal(interaction);
    case 'ask_more':
      return askForMore(interaction);
    default:
      return interaction.reply({
        content: 'Unknown action.',
        ephemeral: true,
      });
  }
}

async function openCompleteModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId(MODALS.COMPLETE_FORM)
    .setTitle('Complete Order');

  const link = new TextInputBuilder()
    .setCustomId('complete_link')
    .setLabel('Website link / domain')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://yoursite.ptcsites.com')
    .setRequired(true);

  const password = new TextInputBuilder()
    .setCustomId('complete_password')
    .setLabel('Admin password')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Password to edit site content')
    .setRequired(true);

  const row1 = new ActionRowBuilder().addComponents(link);
  const row2 = new ActionRowBuilder().addComponents(password);

  modal.addComponents(row1, row2);
  await interaction.showModal(modal);
}

async function openDenyModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId(MODALS.DENY_FORM)
    .setTitle('Deny Order');

  const reason = new TextInputBuilder()
    .setCustomId('deny_reason')
    .setLabel('Reason for denial')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('e.g. duplicates an existing website')
    .setRequired(true);

  const row1 = new ActionRowBuilder().addComponents(reason);
  modal.addComponents(row1);
  await interaction.showModal(modal);
}

async function askForMore(interaction) {
  const embed = interaction.message.embeds?.[0];
  const customerId = parseCustomerId(embed);

  if (!customerId) {
    return interaction.reply({
      content: 'Could not find the customer for this order.',
      ephemeral: true,
    });
  }

  await interaction.update({
    content: interaction.message.content,
    embeds: interaction.message.embeds,
    components: [],
  });

  const customer = interaction.client.users.cache.get(customerId);
  if (customer) {
    await customer
      .send(
        '👋 Our team needs a bit more information to finish your **website order**. Please reply here with any requested details, or reach out in the server. Thanks!'
      )
      .catch(() => {});
  }

  await interaction.followUp({
    content: `Asked ${customer?.username || customerId} for more info.`,
    ephemeral: true,
  });
}

function parseCustomerId(embed) {
  if (!embed) return null;
  const desc = embed.description || '';
  const match = desc.match(/<@(\d+)>/);
  return match ? match[1] : null;
}

module.exports = { handleStaffButton };
