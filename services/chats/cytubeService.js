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
                        console.log(`Pushing conection for channel: ${channel}`)
                        this.connections[channel] = client;
                        client.socket.emit('login', {name: 'chatSync'});
                        client.socket.on('login', data => {
                            if (data.success === true) {
                                console.log(`Logged in to cytube channel ${channel}`);

                            } else {
                                console.error(`Error logging in to cytube channel: ${channel}`);
                                console.error(data);
                            }
                        })
                    })
                });
                console.log(`Logged into cytube channels. ${Object.keys(this.connections).length} clients created`);
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
        console.log('Regitering cytube handlers');
        // TODO Fix this
        Object.entries(this.connections).forEach(e => {
            const [channel, connection] = e;
            console.log(`Registering handlers for cytube channel: ${channel}`)
            connection.on('chatMsg', (data) => {
                console.log(`Got message from cytube ${JSON.stringify(data)}`)
                handlefun('cytube', channel, {username: data.username, text: data.msg})
            });
            connection.on('changeMedia', (data) => {
                console.log(`Got media change from cytube ${JSON.stringify(data)}`);
                handlefun('cytube', channel, {username: 'Now playing', text: data.title})
            });
        })
    }


}

module.exports = new CytubeService();
