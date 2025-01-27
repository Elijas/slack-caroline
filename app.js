let SlackBot = require('slackbots');
let Mitsuku = require('./mitsuku-api');
try { var config = require('./config.js'); } catch (err) {}
const mentionRegex = /^(Caroline|C),/;

function isDirectMessage(channel) {return typeof channel === 'string' && channel[0] === 'D'}

function doReplyToMessage(commObj) {
    let isMessage = () => commObj.type === 'message' && Boolean(commObj.text);
    let isBotMentioned = () => mentionRegex.test(commObj.text);
    let isMessageNotFromSelf = () => commObj.subtype !== 'bot_message';

    return isMessage() && (isDirectMessage(commObj.channel) || isBotMentioned()) && isMessageNotFromSelf();
}

function getResponseText(requestText) {
    return mitsuku.send(requestText)
        .then(function(response) {
            return response.replace('Mitsuku', 'Caroline');
        });
}

function logConversationItem(requestText, responseText, interlocutorName) {
    console.log(JSON.stringify({usr: interlocutorName, req: requestText, res: responseText, ts: new Date()}));
}

function sendReply(interlocutorName, responseText, slackParams, channel) {
    if (isDirectMessage(channel)) {
        return slack.postMessageToUser(interlocutorName, responseText, slackParams)
    } else {
        let roomName = slack.groups.find(i => i.id === channel).name;
        return slack.postMessageToGroup(roomName, responseText, slackParams)
    }
}

let slack = new SlackBot({
    token: process.env.SLACKBOT_API_KEY || config.slackToken,
    name: 'Caroline <3',
});

let slackParams = {
    icon_emoji: ':kiss:'
};

let mitsuku = Mitsuku();

slack.on('message', function(commObj) {
    if (doReplyToMessage(commObj, this.self.id)) {
        let requestText = commObj.text.replace(mentionRegex, '').trim();

        let interlocutorName = slack.users.find(i => i.id === commObj.user).name;
        let responseTextPromise = getResponseText(requestText);
        return responseTextPromise
            .then(responseText => sendReply(interlocutorName, responseText, slackParams, commObj.channel))
            .then(() => responseTextPromise.then(responseText => logConversationItem(requestText, responseText, interlocutorName)))
            .catch(err => console.error(err));
    } else {
        if ((config && config.debugFlag) || false)
            console.log(commObj);
    }
});