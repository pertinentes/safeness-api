const { Client, Collection, GatewayIntentBits, Partials, ActivityType } = require("discord.js");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require("fs");
const colors = require("colors");

class bot extends Client {
    constructor(config) {
        super({
            intents: [
                GatewayIntentBits.Guilds, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildEmojisAndStickers,
                GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping,
                GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping,
                GatewayIntentBits.GuildScheduledEvents, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent
            ],
            partials: [
                Partials.Channel, Partials.GuildMember, Partials.GuildScheduledEvent,
                Partials.Message, Partials.Reaction, Partials.ThreadMember, Partials.User
            ],
            restTimeOffset: 0,
            failIfNotExists: false,
            presence: {
                activities: [{
                    name: `🦦`,
                    type: ActivityType.Streaming,
                    url: "https://www.twitch.tv/hisxokaq"
                }],
                status: "dnd"
            },
            allowedMentions: {
                parse: ["roles", "users", "everyone"],
                repliedUser: false
            }
        });

        this.config = config;
        this.commands = new Collection();
    }

    loadEvents() {
        const eventFiles = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));
        for (const file of eventFiles) {
            const event = require(`../events/${file}`);
            if (event.once) {
                this.once(event.name, (...args) => event.execute(this, ...args));
            } else {
                this.on(event.name, (...args) => event.execute(this, ...args));
            }
        }
    }

    loadCommands() {
        const commandFiles = fs.readdirSync("./src/commands").filter(file => file.endsWith(".js"));
        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            this.commands.set(command.data.name, command);
        }
    }

    async registerCommands() {
        const commands = [];
        this.commands.forEach(command => {
            if (command.data && (!command.guildOnly || command.guildOnly === true)) {
                commands.push(command.data.toJSON());
            }
        });

        const rest = new REST({ version: '10' }).setToken(this.config.token);
        try {
            const data = await rest.put(
                Routes.applicationCommands(this.user.id),
                { body: commands }
            );
            console.log(`Successfully registered ${data.length} application commands.`);
            data.forEach(command => console.log(`Registered command: ${command.name}`));
        } catch (error) {
            console.error('Error while registering application commands:', error);
        }
    }

    async start() {
        this.loadEvents();
        this.loadCommands();
        await this.login(this.config.token);
        this.on('ready', async () => {
            await this.registerCommands();
        });
        process.on("unhandledRejection", (error) => {
            if (error.code == 10062) return;
            console.log(`[ERROR] ${error}`.red);
        });
    }
}

module.exports = bot;