const { SlashCommandBuilder } = require('@discordjs/builders');
const { removeDuplicates } = require('../utils/duplicate');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Supprime les prevnames en double dans la db.'),
    async execute(client, interaction) {
        const dev = client.config.dev;
        if (interaction.user.id !== dev) {
            return interaction.reply({ content: 'Vous n\'êtes pas autorisé à utiliser cette commande.', ephemeral: true });
        }
        try {
            const result = await removeDuplicates();
            await interaction.reply({ content: result, ephemeral: true });
        } catch (error) {
            console.error('Erreur lors de la suppression des doublons:', error);
            await interaction.reply({ content: 'Erreur lors de la suppression des doublons.', ephemeral: true });
        }
    }
};
