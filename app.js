require('dotenv').config();
const Enmap = require("enmap");
const channelMap = new Enmap();

// Telegram
const TeleBot = require('node-telegram-bot-api');
const telegramBot = new TeleBot(process.env.TELEGRAMBOTKEY, {polling: true});
// Discord
const Discord = require('discord.js');
const discordBot = new Discord.Client();
discordBot.login(process.env.DISCORDBOTKEY);
discordBot.on('Ready', () => console.log(`Logged in to discord as ${discordBot.user.tag}`));
// Matrix
const MatrixClient = require("matrix-bot-sdk").MatrixClient;
const AutojoinRoomsMixin = require("matrix-bot-sdk").AutojoinRoomsMixin;
const matrixBot = new MatrixClient('https://matrix.org', process.env.MATRIXBOTKEY);
AutojoinRoomsMixin.setupOnClient(matrixBot);


telegramBot.on('message', msg => {
    if (msg.from.is_bot) return;
    const senderName = msg.from.first_name;
    const text = msg.text;
    if (!text) return;
    if (text.startsWith('/')) {
        // Handle commands
        const [command, argument] = text.substr(1).split(' ') ;
        if (!command) return;
        // TODO Optimise this. A giant switch case isn't very good
        switch (command) {
            case 'pair':
                if (isAuthorised(argument, msg.from.id)) {
                    pairChannel(argument, msg.chat.id, msg.from.id, 'telegram');
                    telegramBot.sendMessage(msg.chat.id, `Added this channel to the ${argument} group`);
                } else {
                    telegramBot.sendMessage(msg.chat.id, `You're not an admin of that group`);
                }
                break;
            case 'myid':
                telegramBot.sendMessage(msg.chat.id, `${msg.from.id}`);
                break;
            case 'addadmin':
                const pairIDs = getGroups(msg.chat.id, 'telegram').keyArray();
                console.log('groups', pairIDs);
                pairIDs.forEach(pairID => {
                    addAdmin(pairID, msg.from.id, argument)
                });
                break;
            default:
                sendMessage('discord', msg.channel.id, {username: msg.author.username, text});
        }
    } else {
        sendMessage('telegram', msg.chat.id, {username: senderName, text});
    }
});

discordBot.on('message', msg => {
    if (msg.author.bot) return;
    const text = msg.cleanContent;
    if (!text) return;
    if (text.startsWith('/')) {
        // Handle commands
        const [command, argument] = text.substr(1).split(' ') ;
        if (!command) return;
        // TODO Optimise this. A giant switch case isn't very good
        switch (command) {
            case 'pair':
                if (isAuthorised(argument, msg.author.id)) {
                    pairChannel(argument, msg.channel.id, msg.author.id,'discord');
                    msg.channel.send(`Added this channel to the ${argument} group`);
                } else {
                    msg.reply('No');
                }
                break;
            case 'myid':
                msg.channel.send(msg.author.id);
                break;
            case 'addadmin':
                const pairIDs = getGroups(msg.channel.id, 'discord').keyArray();
                console.log('groups', pairIDs);
                pairIDs.forEach(pairID => {
                    addAdmin(pairID, msg.author.id, argument)
                });
                break;
            default:
                sendMessage('discord', msg.channel.id, {username: msg.author.username, text});
        }
    } else {
        sendMessage('discord', msg.channel.id, {username: msg.author.username, text});
    }
});

matrixBot.on('room.message', (roomId, event) => {
   console.log('Matrix sender', event.sender);
   console.log('Matrix content', event.content)
});

function sendMessage(source, chatId, payload) {
    const channels = channelMap.filterArray(elem => elem[source].includes(chatId));
    if (!channels.length) return {error: 'Channel not paired with anything'};
    if (!payload.username) return console.error('Empty username');
    if (!payload.text) return console.error('Empty message');
    let sourceName = getSourceName(source);
    channels.forEach(group => {
        if (source !== 'telegram' && group.telegram) group.telegram.forEach(id => telegramBot.sendMessage(id, `${sourceName} *${payload.username}*: ${payload.text}`));
        if (source !== 'discord' && group.discord) group.discord.forEach(id => discordBot.channels.get(id).send(`${sourceName} **${payload.username}**: ${payload.text}`));
        if (source !== 'matrix' && group.matrix) group.matrix.forEach(id => matrixBot.sendMessage(id, `${sourceName} **${payload.username}**: ${payload.text}`));
    });
}
function pairChannel(pairID, channelId, adminId, source) {
    console.log({pairID, channelId, source});
    // Check or create a group exists with this ID
    const channels = channelMap.ensure(pairID, {admins: [adminId.toString()]});
    if (!isAuthorised(pairID, adminId)) return {error: `Not an admin of the channel group. Valid IDs: ${channels.admins.join(', ')}`};
    channelMap.ensure(pairID, [], source);
    channelMap.pushIn(pairID, source, channelId);
}
function isAuthorised(pairID, adminId) {
    const channels = channelMap.get(pairID);
    // If that pairID hasn't be used yet, return true
    if (!channels) return true;
    return channels.admins.includes(adminId.toString());
}
function unpairChannel(pairID, channelId, adminId) {
    // TODO Implement this
}
function addAdmin(pairID, adminId, newadminId) {
    if (!isAuthorised(pairID, adminId.toString())) return {error: `You're not an admin of the channel group`};
    channelMap.pushIn(pairID, 'admins', newadminId.toString());
}
function getGroups(channelID, source) {
    return channelMap.filter(elem => elem[source].includes(channelID));
}
function getSourceName(source) {
    switch (source) {
        case 'discord':
            return 'D';
        case 'telegram':
            return 'T';
        case 'matrix':
            return 'M';
        default:
            return '';
    }
}

