const { SlashCommandBuilder } = require('@discordjs/builders');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('getkey')
    .setDescription('Génère une clé d\'accès.')
    .addStringOption(option =>
      option.setName('role')
        .setDescription('Le rôle de la clé d\'accès (public, bot, dev)')
        .setRequired(true)),

  async execute(client, interaction) {
    const dev = client.config.dev;
    if (interaction.user.id !== dev) {
      return interaction.reply({ content: 'Vous n\'êtes pas autorisé à utiliser cette commande.', ephemeral: true });
    }

    const role = interaction.options.getString('role');
    const validRoles = ['public', 'bot', 'dev'];

    if (!validRoles.includes(role)) {
      return interaction.reply({ content: 'Le rôle spécifié est invalide. Veuillez entrer l\'un des rôles suivants : public, botAccess, devKey.', ephemeral: true });
    }

    const accessKey = uuidv4();
    const accessKeysFilePath = path.join(__dirname, '..', 'accessKeys.json');
    const accessKeysDir = path.dirname(accessKeysFilePath);

    if (!fs.existsSync(accessKeysDir)) {
      fs.mkdirSync(accessKeysDir, { recursive: true });
    }

    let accessKeys = [];

    if (fs.existsSync(accessKeysFilePath)) {
      try {
        accessKeys = JSON.parse(fs.readFileSync(accessKeysFilePath, 'utf8'));
      } catch (err) {
        console.error('Erreur lors de la lecture du fichier accessKeys.json:', err);
        return interaction.reply({ content: 'Une erreur est survenue lors de la génération de la clé d\'accès.', ephemeral: true });
      }
    }

    accessKeys.push({ key: accessKey, role: role, createdAt: new Date() });

    try {
      fs.writeFileSync(accessKeysFilePath, JSON.stringify(accessKeys, null, 2), 'utf8');
    } catch (err) {
      console.error('Erreur lors de l\'écriture dans le fichier accessKeys.json:', err);
      return interaction.reply({ content: 'Une erreur est survenue lors de la génération de la clé d\'accès.', ephemeral: true });
    }

    return interaction.reply({ content: `Votre clé d'accès : \`${accessKey}\` avec le rôle \`${role}\``, ephemeral: true });
  }
};
