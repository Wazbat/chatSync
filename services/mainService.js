const discordService = require('./chats/discordService');
const telegramService = require('./chats/telegramService');
const matrixService = require('./chats/matrixService');
const {Firestore} = require('@google-cloud/firestore');
const firestore = new Firestore();
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

    }

    registerListeners() {
        discordService.registerMessageHandler(this.handleMessage);
        telegramService.registerMessageHandler(this.handleMessage);
        // matrixService.registerMessageHandler(this.handleMessage);
    }

    async handleMessage(source, chatId, payload) {
        // TODO Implement caching to avoid excess reads to firestore
        const querySnapshot = await firestore.collection('channelMaps').where(source, 'array-contains', chatId).get();
        if (!querySnapshot.length) return {error: 'Channel not paired with anything'};
        querySnapshot.forEach(doc => {
           const group = doc.data();
            if (group.discord) group.discord.forEach(id => {if (id !== chatId) discordService.sendMessage(id, source, payload.username, payload.text)});
            if (group.telegram) group.telegram.forEach(id => {if (id !== chatId) telegramService.sendMessage(id, source, payload.username, payload.text)});
            // if (group.matrix) group.matrix.forEach(id => {if (id!== chatId) matrixService.sendMessage(id, source, payload.username, payload.text)});
        });
    }

}
module.exports = new MainService();
