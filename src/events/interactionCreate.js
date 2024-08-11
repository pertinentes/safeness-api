const { InteractionType } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    async execute(client, interaction) {
        if (!interaction.isCommand()) return;
        if (!interaction.guildId) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(client, interaction);
        } catch (error) {
            console.error(`Erreur lors de l'exécution de la commande ${command.name}:`, error);
            await interaction.reply({ content: "Une erreur est survenue lors de l'exécution de cette commande.", ephemeral: true }).catch(() => {});
        }
    }
}
