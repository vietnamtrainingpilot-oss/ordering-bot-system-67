const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { COLORS } = require('../config');
const logger = require('../utils/logger');

/**
 * Staff submitted the "Complete" modal (website link + admin password).
 *
 * 1. DM the customer the website link + admin password.
 * 2. Update the staff order card to reflect completion.
 */
async function handleCompleteModal(interaction) {
  const fields = {};
  for (const row of interaction.fields.fields.values()) {
    fields[row.customId] = row.value;
  }

  const link = fields.complete_link;
  const password = fields.complete_password;

  // Pull the original staff message (the order card)
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

  // Update the staff card to "Completed"
  if (staffMsg) {
    const completedEmbed = EmbedBuilder.from(embed)
      .setColor(COLORS.SUCCESS)
      .addFields({
        name: '✅ Status',
        value: `Completed by <@${interaction.user.id}>\n**Website:** ${link}`,
      });

    await staffMsg.edit({ embeds: [completedEmbed], components: [] });
  }

  // DM the customer with their website + admin password
  if (!customer) {
    logger.warn(`Customer ${customerId} not in cache for completion DM`);
  } else {
    const deliveryEmbed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('🎉 Your Website Is Ready!')
      .setDescription(
        `Congratulations **${customer.username}**! Your website for **${orderTitle.replace(
          /New Website Order|Order/gi,
          ''
        )}** is live.`
      )
      .addFields(
        { name: '🌐 Website', value: link || '—' },
        { name: '🔑 Admin Password', value: password || '—' }
      )
      .setFooter({
        text: 'Keep this password safe — it lets you edit your site content.',
      });

    const supportButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel('Visit Your Website')
        .setURL(link)
    );

    await customer.send({ embeds: [deliveryEmbed], components: [supportButton] });
  }

  await interaction.reply({
    content: `Order completed and delivered to <@${customerId}>.`,
    ephemeral: true,
  });
}

function parseCustomerId(embed) {
  if (!embed) return null;
  const desc = embed.description || '';
  const match = desc.match(/<@(\d+)>/);
  return match ? match[1] : null;
}

module.exports = { handleCompleteModal };
