require('dotenv').config();


// Telegram
const TeleBot = require('node-telegram-bot-api');
const telegramBot = new TeleBot(process.env.TELEGRAMBOTKEY, {polling: true});
// Discord
const Discord = require('discord.js');
const discordBot = new Discord.Client();
discordBot.login(process.env.DISCORDBOTKEY);
// Matrix
const MatrixClient = require("matrix-bot-sdk").MatrixClient;
const AutojoinRoomsMixin = require("matrix-bot-sdk").AutojoinRoomsMixin;
const matrixBot = new MatrixClient('https://matrix.org', process.env.MATRIXBOTKEY);
AutojoinRoomsMixin.setupOnClient(matrixBot);


const channelMap = new Map();

let telegramChatId = process.env.TELEGRAMCHATID;
let discordChannelId = process.env.DISCORDCHANNELID;
let MATRIX_ROOM_ID = process.env.MATRIXROOMID;

telegramBot.on('message', msg => {
    if (msg.from.is_bot) return;
    const senderName = msg.from.username || msg.from.first_name;
    const text = msg.text;
    if (!text) return;
    if (/^\/discord \d+$/i.test(text)) {
        // Command to set the discord channel
        const discordChannel = discordBot.channels.get(text.substr(9));
        if (discordChannel) {
            console.log('Setting channel', discordChannel.id);
            discordChannelId = discordChannel.id;
            telegramBot.sendMessage(msg.chat.id, `Paired with discord channel: ${discordChannelId}`);
            discordChannel.send(`Now paired with telegram chat: ${msg.chat.id}`);
        } else {
            console.error(`Nonexistent discord channel: "${text.substr(9)}"`);
            telegramBot.sendMessage(msg.chat.id, `I'm sorry. I couldn't access any discord channels with that ID`);
        }
    } else {
        sendMessage('telegram', msg.chat.id, {username: senderName, text});
    }

});

discordBot.on('message', msg => {
    if (msg.author.bot) return;
    const text = msg.cleanContent;
    if (!text) return;
    sendMessage('discord', {username: msg.author.username, text});
});

matrixBot.on('room.message', (roomId, event) => {
   console.log('Matrix sender', event.sender);
   console.log('Matrix content', event.content)
});

async function sendMessage(source, chatId, payload) {
    if (!payload.username) return console.error('Emtpy username');
    if (!payload.text) return console.error('Emtpy username');
    let sourceName = getSourceName(source);
    if (source !== 'telegram') telegramBot.sendMessage(telegramChatId, `${sourceName} *${payload.username}*: ${payload.text}`);
    if (source !== 'discord') discordBot.channels.get(discordChannelId).send(`${sourceName} **${payload.username}**: ${payload.text}`);
    // if (source !== 'matrix') matrixBot.sendMessage(MATRIX_ROOM_ID, `${sourceName} **${payload.username}**: ${payload.text}`);
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

function discordPair(channelID, sourceID, source) {
    const channel = discordBot.channels.get(channelID);
    if (!channel) return {error: 'No channel with that ID'}
    channel.send(`Do you want to pair with ${sourceID}`)
}
