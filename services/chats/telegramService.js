const TeleBot = require('node-telegram-bot-api');


class telegramService {
    init(token) {
        return new Promise((resolve, reject) => {
            try {
                console.log(`Logging in to telegram with token: ${token}`);
                this.client = new TeleBot(token, {polling: true});
                console.log(`Telegram Bot live`);
                resolve();
            } catch (e) {
                reject(e)
            }
        })


    }
    sendMessage(channelID, prefix, username, content) {
        return this.client.sendMessage(channelID, `${prefix} *${username}*: ${content}`);
    }

    registerMessageHandler(handlefun) {
        this.client.on('message', (msg => {
            if (msg.from.is_bot) return;
            const senderName = msg.from.first_name;
            const text = msg.text;
            if (text.startsWith('/')) {
                // Handle commands
                const [command, argument] = text.substr(1).split(' ') ;
                if (!command) return;
                this.client.sendMessage(msg.chat.id, `You tried to use a command: ${command}`)
            } else {
                handlefun('telegram', msg.chat.id, {username: senderName, text});
            }
        }))
    }


}

module.exports = new telegramService();
