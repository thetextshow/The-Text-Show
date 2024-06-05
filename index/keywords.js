/**
 * KEYWORDS
 **/

const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { sendMessage, sendButtons, sendList } = require('../messaging/messaging.js');
const { MSG, format } = require('../messaging/MSG.js');

initializeApp();

const db = getFirestore(process.env.DATABASE);
const keywords = {PLAY: "PLAY", HELP: "HELP", STOP: "STOP"};

async function checkKeyword(word, timestamp, number) {
    console.log(number + " said " + word);
    // if the user does not exist, we need them to opt in first
    const user = await db.collection('users').doc(number).get();
    if(!user.exists) {
        if(word === "PLAY") {
            play(false, number);
        }
        else {
            sendMessage(MSG.JOIN, number);
        }
        return;
    } 

    /**
     * If the user sends a keyword, we run that command.
     * Otherwise, we respond based on what is live. The user
     * either is correct, hears nothing because they were
     * incorrect during a live competition, or receives an
     * informative message about the keywords and competitions.
     **/
    switch (word) {
        case 'PLAY':
            await play(true, number);
            break;
        case 'HELP':
            help(number);
            break;
        case 'STOP':
            await stop(user, number);
            break;
        case '!INSPO!':
            if(number === '17146060669' && !process.env.DATABASE) {
                await inspo(number);
                break;
            }
        default:
            const live = await whatIsLive(user, number);
            if(live === "NONE") sendList(format(MSG.NOT_KEY, word), number, MSG.HELP_OPTIONS);
            else await handleAnswer(live, user, word, timestamp, number);
    }
}

async function play(userExists=true, number) {
    if(userExists) {
        sendMessage(MSG.PLAY, number);
    }
    else {
        const oldUser = await db.collection('oldUsers').doc(number).get();
        if(oldUser.exists) {
          await db.collection('users').doc(number).set(oldUser.data());
          await db.collection('oldUsers').doc(number).delete();
        }
        else {
            await db.collection('users').doc(number).set({
                balance: 0,
                number: number,
                createdAt: FieldValue.serverTimestamp()
            });
        }
        sendMessage(MSG.WELCOME, number);
    }
}

function help(number) {
    sendList(MSG.HELP, number, MSG.HELP_OPTIONS);
}

// move the user to a different collection
async function stop(user, number) {
    const { live, ...oldUser } = user.data();
    await db.collection('oldUsers').doc(number).set(oldUser);
    await db.collection('users').doc(number).delete();
    sendMessage(MSG.STOP, number);
}

async function inspo(number) {
    var numbers = [];
    var finalStr = "";
    while (numbers.length < 20) {
        var randomNumber = Math.floor(Math.random() * 468317) + 1; 
        if (!numbers.includes(randomNumber)) {
            const jep = await db.collection('inspo').doc(randomNumber.toString()).get();
            finalStr += (numbers.length + 1).toString() + ': ' + jep.data()['string'] + '\n\n';
            numbers.push(randomNumber);
        }
    }
    sendMessage(finalStr, number);
}

// returns "FREE", "PAID", or "NONE" based on which
// competition is live
async function whatIsLive(user='none', number) {
    if(user === 'none') user = await db.collection('users').doc(number).get();
    return user.data()?.['live']?.['type'] ? user.data()['live']['type'] : "NONE";
}

// returns true if the player paid for the $1 competition
async function registeredForPaid(number) {
    const user = await db.collection('paid').doc(number).get();
    return user.exists;
}

async function handleAnswer(type, user, word, timestamp, number) {
    if(!(user.data()['live']['acceptAnswer'])) return;

    await db.collection('users').doc(number).update({
        ['live.acceptAnswer']: false
    });

    const answersArray = await db.collection('QnA').doc('answers').get();
    const answers = answersArray.data()[type];
    const questionsArray = await db.collection('QnA').doc('questions').get();
    const questions = questionsArray.data()[type];
    const optionsArray = await db.collection('QnA').doc('options').get();
    const options = optionsArray.data()[type];

    const oldWamid = user.data()['live']['wamid'];
    await db.collection('users').doc(number).update({
        [`live.history.${oldWamid}.reply`]: word,
        [`live.history.${oldWamid}.replyTime`]: timestamp
    });
    const time = timestamp - user.data()['live']['history'][oldWamid]['msgTime'];
    await db.collection('users').doc(number).update({
        ['live.answerTime']: FieldValue.increment(time)
    });
    
    const convoCount = user.data()['live']['convoCount'];
    const correctAnswer = answers[convoCount].toLowerCase() === word.toLowerCase();
    if(convoCount === answers.length - 1) {
        if(user.data()['live']['allCorrect'] && correctAnswer) {
            sendMessage(MSG.ALL_CORRECT, number);

            await db.collection('users').doc(number).update({
                ['live.score']: FieldValue.increment(1)
            });
        }
        else if(!correctAnswer){
            sendMessage(MSG.LOST_INCORRECT, number);
            await db.collection('users').doc(number).update({
                ['live.allCorrect']: false
            });
        }
        else {
            sendMessage(MSG.LOST_CORRECT, number);

            await db.collection('users').doc(number).update({
                ['live.score']: FieldValue.increment(1)
            });
        }
    }
    else {
        let msg;
        let updatePayload;
        if(correctAnswer) {
            msg = format(MSG.CORRECT, questions[convoCount+1]);
            updatePayload = (wamid) => {
                return {
                    ['live.convoCount']: convoCount+1,
                    ['live.score']: FieldValue.increment(1),
                    [`live.history.${wamid}.msg`]: msg,
                    [`live.wamid`]: wamid,
                    ['live.acceptAnswer']: true
                }
            };
        }
        else {
            msg = format(MSG.WRONG, questions[convoCount+1]);
            updatePayload = (wamid) => {
                return {
                    ['live.convoCount']: convoCount+1,
                    [`live.history.${wamid}.msg`]: msg,
                    [`live.wamid`]: wamid,
                    ['live.acceptAnswer']: true,
                    ['live.allCorrect']: false
                }
            };
        }

        const timeLeft = new Date(user.data()['live']['endTime']) - new Date();
        const minutesLeft = Math.floor(timeLeft / 60000);
        const footer = format(MSG.FOOTER, convoCount+2, answers.length, minutesLeft);
        sendButtons(msg, number, options[convoCount+1], "", footer)
            .then(async (wamid) => {
                wamid = wamid.split('.')[1];
                await db.collection('users').doc(number).update(updatePayload(wamid));
            })
            .catch((error) => {
                console.log(error);
            });
    }

    // if(answers[convoCount].toLowerCase() === word.toLowerCase()) {
    //     if(convoCount === answers.length - 1) {
    //         // WIN
    //         if(user.data()['live']['allCorrect']) {
    //             sendMessage(MSG.ALL_CORRECT, number);
    //         }
    //         else {
    //             sendMessage(MSG.LOST, number);
    //         }
    //     }
    //     else {
    //         const msg = format(MSG.CORRECT, questions[convoCount+1]);
    //         const timeLeft = new Date(user.data()['live']['endTime']) - new Date();
    //         const minutesLeft = Math.floor(timeLeft / 60000);
    //         const footer = format(MSG.FOOTER, convoCount+2, answers.length, minutesLeft);
    //         sendButtons(msg, number, options[convoCount+1], "", footer)
    //             .then(async (wamid) => {
    //                 wamid = wamid.split('.')[1]
    //                 await db.collection('users').doc(number).update({
    //                     ['live.convoCount']: convoCount+1,
    //                     [`live.history.${wamid}.msg`]: msg,
    //                     [`live.wamid`]: wamid,
    //                     ['live.acceptAnswer']: true
    //                 });
    //             })
    //             .catch((error) => {
    //                 console.log(error);
    //             });
    //     }
    // }
    // else {
    //     const msg = format(MSG.WRONG, questions[convoCount+1]);
    //     const timeLeft = new Date(user.data()['live']['endTime']) - new Date();
    //     const minutesLeft = Math.floor(timeLeft / 60000);
    //     const footer = format(MSG.FOOTER, convoCount+2, answers.length, minutesLeft);
    //     sendButtons(msg, number, options[convoCount+1], "", footer)
    //         .then(async (wamid) => {
    //             wamid = wamid.split('.')[1]
    //             await db.collection('users').doc(number).update({
    //                 ['live.convoCount']: convoCount+1,
    //                 [`live.history.${wamid}.msg`]: msg,
    //                 [`live.wamid`]: wamid,
    //                 ['live.acceptAnswer']: true,
    //                 ['live.allCorrect']: false
    //             });
    //         })
    //         .catch((error) => {
    //             console.log(error);
    //         });
    // }
}

// records the actual time the player was sent the question
// also sets acceptAnswer to true
async function addTimestamp(wamid, timestamp, number) {
    const user = await db.collection('users').doc(number).get();
    const live = await whatIsLive(user);
    if(live === "NONE") return;

    wamid = wamid.split('.')[1];
    // the first message, which is sent via template
    if(user.data()['live']?.['wamid'] === wamid) {
        await db.collection('users').doc(number).update({
            [`live.history.${wamid}.msgTime`]: timestamp,
            ['live.acceptAnswer']: true
        });
        return;
    }

    await db.collection('users').doc(number).update({
        [`live.history.${wamid}.msgTime`]: timestamp
    });
}

module.exports = { checkKeyword, addTimestamp };
