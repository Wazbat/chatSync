const discordService = require('./chats/discordService');
const telegramService = require('./chats/telegramService');
const matrixService = require('./chats/matrixService');
const cytubeService = require('./chats/cytubeService');
const databseService = require('./databaseService');
const secretService = require('./secretService');

class MainService {
    async init() {
        let discordToken;
        let telegramToken;
        let matrixToken;
        try {
            [discordToken, telegramToken, matrixToken] = await Promise.all([
                secretService.getSecret('projects/743360412515/secrets/discord_key/versions/latest'),
                secretService.getSecret('projects/743360412515/secrets/telegram_key/versions/latest'),
                secretService.getSecret('projects/743360412515/secrets/matrix_key/versions/latest')
            ]);
        } catch (e) {
            console.error('Error reading credentials');
            throw e;
        }

        try {
            await Promise.all([
                discordService.init(discordToken),
                telegramService.init(telegramToken),
               // matrixService.init(matrixToken)
                cytubeService.init()
            ]);
        } catch (e) {
            console.error('Error starting chat clients');
            throw e;

        }
        try {
            this.registerListeners();
        } catch (e) {
            console.error(`Error adding listeners`);
            throw e;
        }
        console.log('Started sync service');
    }

    registerListeners() {
        discordService.registerMessageHandler(this.handleMessage);
        telegramService.registerMessageHandler(this.handleMessage);
        // matrixService.registerMessageHandler(this.handleMessage);
        cytubeService.registerMessageHandler(this.handleMessage);
    }

    async handleMessage(source, chatId, payload) {
        console.log(`Handling message from: ${source}, chat ID: ${chatId}`);
        const groups = databseService.getGroups(source, chatId);
        console.log(`Got ${groups.length} groups for message`);
        if (!groups.length) return console.log('Channel not paired with anything');
        groups.forEach(group => {
            if (group.discord) group.discord.forEach(id => { try { if (id !== chatId) discordService.sendMessage(id, source, payload.username, payload.text) } catch (e) {console.error(`Failed to send discord message: ${e.message}`)}});
            if (group.telegram) group.telegram.forEach(id => { try { if (id !== chatId) telegramService.sendMessage(id, source, payload.username, payload.text) } catch (e) {console.error(`Failed to send telegram message: ${e.message}`)}});
            if (group.matrix) group.telegram.forEach(id => { try { if (id !== chatId) matrixService.sendMessage(id, source, payload.username, payload.text)} catch (e) {console.error(`Failed to send matrix message: ${e.message}`)}});
            if (group.cytube) group.cytube.forEach(id => { try { if (id !== chatId) cytubeService.sendMessage(id, source, payload.username, payload.text)} catch (e) {console.error(`Failed to send cytube message: ${e.message}`)}});
        });
    }

}
module.exports = new MainService();
