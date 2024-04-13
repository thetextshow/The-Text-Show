function format(message, ...values) {
  values.forEach((value, index) => {
		  message = message.replace(`%${index}%`, value);
		});
		return message;
}

const MSG = Object.freeze({
	JOIN: "Send PLAY to opt into The Text Show!",
	NOT_KEY: "%0% is not a keyword. Type HELP to see a list of keywords.",
	PLAY: "You typed PLAY",
	WELCOME: "Welcome!",
	HELP: "You typed HELP",
	STOP: "You have been unsubscribed from The Text Show. Send PLAY to resubscribe.",
	ALL_CORRECT: "Correct!\n\n" + "You got everything correct! We'll let you know if you won soon.",
	CORRECT: "Correct! Next Question:\n\n%0%\n\nOnly your FIRST answer will be considered.",
	WRONG: "WRONG !!! u LOSE",
	WON: "You actually won."
});

module.exports = { MSG, format }
