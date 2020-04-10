const cytube = require('cytube-client');
const databseService = require('../databaseService');
const MAX_RETRIES = 20;
const USERNAME = 'chatSync';
class CytubeService {
    init() {
        // TODO Implement a way to dynamically login and logout (.close) from channels when a subscription is added or removed
        return new Promise(async (initresolve, initreject) => {
            try {
                const channels = await databseService.getCytubeChannels();
                console.log(`Registering cytube listeners for ${channels.length} channels`);
                this.connections = {};
                const connectPromises = channels.map(channel => {
                    return new Promise((resolve, reject) => {
                        cytube.connect(channel, (err, client) => {
                            if (err) {
                                console.error(`Cytube error for channel: ${channel}`);
                                console.error(err);
                                reject();
                            }
                            console.log(`Pushing conection for channel: ${channel}`);
                            this.connections[channel] = client;
                            let retries = 0;
                            const login = () => {
                                console.log(`Logging in to ${channel}, ${retries} retries`);
                                client.socket.emit('login', {name: USERNAME});
                            };
                            login();
                            client.socket.on('login', data => {
                                if (data.success === true) {
                                    console.log(`Logged in to cytube channel ${channel}`);
                                    resolve();
                                } else if (data.error === 'That name is already in use on this channel.') {
                                    if(retries < MAX_RETRIES) {
                                        console.error(`Old client still connected to ${channel}, retrying`);
                                        retries++;
                                        // Try to login again after a minute
                                        setTimeout(login, 60000);
                                    } else {
                                        console.error(`Failed to login to cytube after ${retries} retries`);
                                        reject(data);
                                    }

                                } else {
                                    console.error(`Error connecting to cytube channel ${channel}`);
                                    console.error(JSON.stringify(data));
                                    reject(data);
                                }
                            })
                        })
                    });
                });
                // TODO Handle things if one server fails
                await Promise.all(connectPromises);
                console.log(`Logged into all cytube channels. ${Object.keys(this.connections).length} clients created`);
                initresolve();
            } catch (e) {
                initreject(e);
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
        console.log(`Registering cytube handers for ${Object.entries(this.connections).length} connections`);
        Object.entries(this.connections).forEach(e => {
            const [channel, connection] = e;
            console.log(`Registering handlers for cytube channel: ${channel}`);
            connection.on('chatMsg', (data) => {
                if (data.username === USERNAME) return;
                handlefun('cytube', channel, {username: data.username, text: data.msg})
            });
            connection.on('changeMedia', (data) => {
                handlefun('cytube', channel, {username: 'Now playing', text: data.title})
            });
        })
    }


}

module.exports = new CytubeService();
