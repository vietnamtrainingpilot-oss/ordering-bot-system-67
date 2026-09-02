const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../config');
const logger = require('../utils/logger');

/**
 * Staff submitted the "Deny" modal (reason).
 *
 * 1. DM the customer with the denial reason.
 * 2. Update the staff order card to reflect the denial.
 */
async function handleDenyModal(interaction) {
  const fields = {};
  for (const row of interaction.fields.fields.values()) {
    fields[row.customId] = row.value;
  }
  const reason = fields.deny_reason;

  const staffMsg = interaction.message;
  const embed = staffMsg?.embeds?.[0];
  const customerId = parseCustomerId(embed);
  const orderTitle = embed?.title || 'your website';

  if (!customerId) {
    return interaction.reply({
      content: 'Could not find the customer for this order.',
      ephemeral: true,
    });
  }

  const customer = interaction.client.users.cache.get(customerId);

  // Update the staff card
  if (staffMsg) {
    const deniedEmbed = EmbedBuilder.from(embed)
      .setColor(COLORS.ERROR)
      .addFields({
        name: '❌ Status',
        value: `Denied by <@${interaction.user.id}>\n**Reason:** ${reason}`,
      });
    await staffMsg.edit({ embeds: [deniedEmbed], components: [] });
  }

  // DM the customer
  if (customer) {
    const denyEmbed = new EmbedBuilder()
      .setColor(COLORS.ERROR)
      .setTitle('⚠️ Order Not Approved')
      .setDescription(
        `Hi **${customer.username}**, unfortunately we couldn't approve your order for **${orderTitle
          .replace(/New Website Order|Order/gi, '')
          .trim()}**.`
      )
      .addFields({ name: 'Reason', value: reason || 'Not specified' })
      .setFooter({
        text: 'If you believe this is a mistake, contact us in the server.',
      });

    await customer.send({ embeds: [denyEmbed] }).catch(() => {
      logger.warn(`Could not DM ${customerId} for denial`);
    });
  }

  await interaction.reply({
    content: `Order denied and <@${customerId}> has been notified.`,
    ephemeral: true,
  });
}

function parseCustomerId(embed) {
  if (!embed) return null;
  const desc = embed.description || '';
  const match = desc.match(/<@(\d+)>/);
  return match ? match[1] : null;
}

module.exports = { handleDenyModal };
