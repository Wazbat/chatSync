const cytube = require('cytube-client');
const databseService = require('../databaseService');
const MAX_RETRIES = 20;
class CytubeService {
    init() {
        return new Promise(async (initresolve, initreject) => {
            try {
                const channels = await databseService.getCytubeChannels();
                console.log(`Registering cytube listeners and handlers for ${channels.length} channels`);
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
                            const login = () => {
                                client.socket.emit('login', {name: 'chatSync'});
                            };
                            login();
                            let retries = 0;
                            client.socket.on('login', data => {
                                if (data.success === true) {
                                    console.log(`Logged in to cytube channel ${channel}`);
                                    resolve();
                                } else {
                                    console.error(`Error logging in to cytube channel: ${channel}`);
                                    console.error(data);
                                    if(retries < MAX_RETRIES) {
                                        // Try to login again after a minute
                                        setTimeout(login, 60000);
                                    } else {
                                        console.error(`Failed to login to cytube after ${MAX_RETRIES} retries`);
                                        reject(data);
                                    }

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
