const MatrixClient = require('matrix-bot-sdk').MatrixClient;
const AutojoinRoomsMixin = require('matrix-bot-sdk').AutojoinRoomsMixin;

class MatrixService {
    init(token) {
        return new Promise((resolve, reject) => {
            try {
                this.client = new MatrixClient('https://matrix.org', token);
                AutojoinRoomsMixin.setupOnClient(this.client);
                console.log('Logged in to matrix');
                resolve();
            } catch (e) {
                reject(e)
            }
        })


    }
    sendMessage(channelID, prefix, username, content) {
        // TODO Fix this
        console.log(`Send message from matrix to channel: ${channelID} with content: ${content}`);
    };
    registerMessageHandler(handlefun) {
        this.client.on('room.message', (roomId, event) => {
            console.log('Matrix sender', event.sender);
            console.log('Matrix content', event.content);
            handlefun('matrix', roomId, {username: event.sender, text: event.content});
        });
    }


}

module.exports = new MatrixService();
