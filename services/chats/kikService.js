const util = require('util');
const http = require('http');
const Bot  = require('@kikinteractive/kik');
// https://github.com/kikinteractive/kik-node
class KikService {
    init(token) {
        return new Promise((resolve, reject) => {
            try {
                // TODO Finish this
                this.client = new Bot({
                    username: 'BOT_USERNAME_HERE', // The username you gave BotsWorth on Kik
                    apiKey: 'BOT_API_KEY_HERE', // The API Key you can find on your profile on dev.kik.com
                    baseUrl: 'WEBHOOK_HERE' // THIS IS YOUR WEBHOOK! make sure this maches the web tunnel or host you have running
                });
                this.client.updateBotConfiguration();
                console.log('Logged in to matrix');
                resolve();
            } catch (e) {
                reject(e)
            }
        })


    }
    sendMessage(channelID, prefix, username, content) {
        // I won't be able to use this. The bot will get a 403 error if I try to send a message to a group longer than 2 minutes after the bot was mentioned

    };
    registerMessageHandler(handlefun) {
        // I think this will only fire if the bot is mentioned in a group
        // Also consider onPictureMessage and onVideoMessage
        this.client.onTextMessage(async (message) => {
            // https://dev.kik.com/#/docs/messaging#receiving-messages
            if (message.chatType !== 'public') return;
            const user = await this.client.getUserProfile(message.from);

            // Consider also using user.displayName or user.firstName
            handlefun('kik', message.chatId, {username: user.username, profilePicUrl: user.profilePicUrl, text: message.body});
        })
    }


}

module.exports = new KikService();
