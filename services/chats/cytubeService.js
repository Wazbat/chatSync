const cytube = require('cytube-client');
const databseService = require('../databaseService');

class CytubeService {
    init() {
        return new Promise(async (resolve, reject) => {
            try {
                const channels = await databseService.getCytubeChannels();
                console.log(`Registering cytube listeners and handlers for ${channels.length} channels`);
                this.connections = {};
                channels.forEach(channel => {
                    cytube.connect(channel, (err, client) => {
                        if (err) {
                            console.error(`Cytube error for channel: ${channel}`);
                            console.error(err);
                            return;
                        }
                        this.connections[channel] = client;
                        client.socket.emit('login', {name: 'chatSync'});
                        client.socket.on('login', data => {
                            if (data.success === true) {
                                console.log(`Logged in to cytube channel ${channel}`);
                                resolve();
                            } else {
                                console.error(`Error logging in to cytube channel: ${channel}`);
                                console.error(data);
                                reject()
                            }
                        })
                    })
                });
                resolve();
            } catch (e) {
                reject(e);
            }
        })


    }
    sendMessage(channelID, prefix, username, content) {
        console.log ('Figure out how to send messages to cytube');
        try {
            if (!this.connections[channelID]) return console.error(`Tried to send a message to cytube: ${channelID} but there is no connection`);
            this.connections[channelID].socket.emit('chatMsg', {msg: `${prefix} - ${username}: ${content}`, meta: {}});
        } catch (e) {
            console.error('Failed to send cytube message');
            console.error(e)
        }

    };
    async registerMessageHandler(handlefun) {
        for (const [channel, connection] of Object.entries(this.connections)) {
            connection.on('chatMsg', (data) => {
                handlefun('cytube', channel, {username: data.username, text: data.msg})
            });
            connection.on('changeMedia', (data) => {
                handlefun('cytube', channel, {username: 'Now playing', text: data.title})
            });
        }
    }


}

module.exports = new CytubeService();
