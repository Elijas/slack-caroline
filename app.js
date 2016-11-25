var SlackBot = require('slackbots');
var Promise = require('bluebird');

// create a bot 
var bot = new SlackBot({
    token: '',
    name: 'Karolina <3',
});

var params = {
    icon_emoji: ':kiss:'
};

function doReplyToMessage(commObj, selfId) {
    var isMessage = () => commObj.type === 'message' && Boolean(commObj.text);
    var isDirectMessage = () => typeof commObj.channel === 'string' && commObj.channel[0] === 'D';
    var messageNotFromSelf = () => commObj.subtype !== 'bot_message';

    return isMessage() && isDirectMessage() && messageNotFromSelf();
}

function getResponseText(requestText) {
    return requestText;
}

bot.on('message', function(commObj) {
    if (doReplyToMessage(commObj, this.self.id)) {
        var interlocutorName = bot.users.find(i => i.id === commObj.user).name;

        var responseText = getResponseText(commObj.text)

        return bot.postMessageToUser(interlocutorName, responseText, params)
            .catch(err => console.log(err));
    }
});