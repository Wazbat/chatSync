const Discord = require('discord.js');

class DiscordService {
    constructor() {
        this.client = new Discord.Client();

    }
    init(token) {
        return new Promise((resolve, reject) => {
            try {
                this.client.on('ready', () => {
                    console.log(`Logged in to discord as ${this.client.user.tag}`);
                    resolve();
                });
                this.client.login(token);
            } catch (e) {
                reject(e)
            }
        });
    }
    sendMessage(channelID, prefix, username, content) {
        const channel = this.client.channels.get(channelID);
        if (!channel) return {error: `Could not get channel with ID: ${channel}`};
        return channel.send(`${prefix} - **${username}:** ${content}`);
    };
    registerMessageHandler(handlefun) {
        this.client.on('message', (message => {
            if (message.author.bot) return;
            const text = message.cleanContent;
            if (!text) return;
            if (text.startsWith('/')) {
                // Handle commands
                const [command, argument] = text.substr(1).split(' ') ;
                if (!command) return;
                message.reply(`You tried to use a command: ${command}`)
            } else {
                handlefun('discord', message.channel.id.toString(), {username: message.author.username, text});
            }
        }))
    }

    getGuildData(guildID) {
        let guild;
        try {
            guild = this.client.guilds.get(guildID);
        } catch (e) {
            console.error(e);
            throw new Error(`Error getting guild with ID: ${guildID}`)
        }
        if(!guild) throw new Error(`Unable to find guild with ID: ${guildID}`);
        if(!guild.available) throw new Error(`Guild not available ID: ${guildID}`);
        const channels = guild.channels.map((channel, key) => ({
            key,
            name: channel.name,
            type: channel.type
        }));
        return {
            id: guild.id,
            icon: guild.icon,
            memberCount: guild.memberCount,
            channels
        }

    }
}

module.exports = new DiscordService();
