function format(message, ...values) {
  values.forEach((value, index) => {
		  message = message.replace(`%${index}%`, value);
		});
	return message;
}

// messages in delivery are generated programmatically
// so they have to be edited from delivery
const MSG = Object.freeze({
	JOIN: "Send PLAY to opt into The Text Show!",
	NOT_KEY: "\"%0%\" is not a keyword. Type HELP to see a list of keywords.",
	PLAY: "You typed PLAY",
	WELCOME: "Welcome!",
	HELP: "Tap below to see a list of actions you can do",
	STOP: "You have been unsubscribed from The Text Show. Send PLAY to resubscribe.",
	ALL_CORRECT: "Correct!\n\n" + "You got everything correct! We'll let you know if you won soon.",
	LOST: "You didn't win, but we're still proud of you 🤗",
	CORRECT: "Correct! Next Question:\n\n%0%",
	WRONG: "Wrong... 😞\n" + "u can keep playing just for fun 🙂\n\n%0%",
	WON: "You actually won."
});

module.exports = { MSG, format }
