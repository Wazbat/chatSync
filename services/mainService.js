const discordService = require('./chats/discordService');
const telegramService = require('./chats/telegramService');
const matrixService = require('./chats/matrixService');
const {Firestore} = require('@google-cloud/firestore');
const firestore = new Firestore();
const secretService = require('./secretService');

class MainService {
    async init() {
        const [discordToken, telegramToken, matrixToken] = await Promise.all([
            secretService.getSecret(process.env.DISCORDKEYPATH),
            secretService.getSecret(process.env.TELEGRAMKEYPATH),
            secretService.getSecret(process.env.MATRIXKEYPATH)
        ]);
        try {
            await Promise.all([
                discordService.init(discordToken),
                telegramService.init(telegramToken),
                matrixService.init(matrixToken)
            ]);
        } catch (e) {
            console.error('Error starting chat clients');
            console.error(e);
        }
        try {
            this.registerListeners();
        } catch (e) {
            console.error(`Error adding listeners`)
        }

    }

    registerListeners() {
        discordService.registerMessageHandler(this.handleMessage);
        telegramService.registerMessageHandler(this.handleMessage);
        matrixService.registerMessageHandler(this.handleMessage);
    }

    async handleMessage(source, chatId, payload) {
        // TODO Implement caching to avoid excess reads to firestore
        const querySnapshot = await firestore.collection('channelMaps').where(source, 'array-contains', chatId).get();
        if (!querySnapshot.length) return {error: 'Channel not paired with anything'};
        querySnapshot.forEach(doc => {
           const group = doc.data();
            if (group.discord) group.discord.forEach(id => {if (id !== chatId) discordService.sendMessage(id, source, payload.username, payload.text)});
            if (group.telegram) group.telegram.forEach(id => {if (id !== chatId) telegramService.sendMessage(id, source, payload.username, payload.text)});
            if (group.matrix) group.matrix.forEach(id => {if (id!== chatId) matrixService.sendMessage(id, source, payload.username, payload.text)});
        });
    }

}
module.exports = new MainService();
