let SlackBot = require('slackbots');
let Promise = require('bluebird');
let Mitsuku = require('./mitsuku-api');

const mentionSubstring = 'Caroline, ';

function doReplyToMessage(commObj, selfId) {
    let isMessage = () => commObj.type === 'message' && Boolean(commObj.text);
    let isDirectMessage = () => typeof commObj.channel === 'string' && commObj.channel[0] === 'D';
    let isBotMentioned = () => commObj.text.includes(mentionSubstring);
    let isMessageNotFromSelf = () => commObj.subtype !== 'bot_message';

    return isMessage() && (isDirectMessage() || isBotMentioned()) && isMessageNotFromSelf();
}

function getResponseText(requestText) {
    return mitsuku.send(requestText)
        .then(function(response) {
            return response;
        });
}

function logConversationItem(requestText, responseText, interlocutorName) {
    console.log({ts: new Date(), usr: interlocutorName, req: requestText, res: responseText});
}

let slack = new SlackBot({
    token: process.env.SLACKBOT_API_KEY,
    name: 'Caroline <3',
});

let slackParams = {
    icon_emoji: ':kiss:'
};

let mitsuku = Mitsuku();

slack.on('message', function(commObj) {
    if (doReplyToMessage(commObj, this.self.id)) {
        let interlocutorName = slack.users.find(i => i.id === commObj.user).name;

        let requestText = commObj.text.replace(mentionSubstring, '');

        let responseTextPromise = getResponseText(requestText);
        return responseTextPromise
            .then(responseText => slack.postMessageToUser(interlocutorName, responseText, slackParams))
            .then(() => responseTextPromise.then(responseText => logConversationItem(requestText, responseText, interlocutorName)))
            .catch(err => console.error(err));
    }
});