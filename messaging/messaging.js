/**
 * MESSAGES
 **/

const axios = require('axios');
const auth_token = process.env.AUTH_TOKEN;

function sendButtons(msg, to, options, header="", footer="") {
  // randomizing button order and building a proper button array
  const randomItem = arr => arr.splice((Math.random() * arr.length) | 0, 1)[0];
  const arrLength = options['answers'].length;
  let buttons = [];
  for(let i = 0; i < arrLength; i++) {
    const name = randomItem(options['answers']);
    buttons.push({
      "type": "reply",
      "reply": {
        "id": name,
        "title": name
      }
    });
  }

  const data = JSON.stringify({
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": to,
    "type": "interactive",
    "interactive": {
      "type": "button",
      "header": {
        "type": "text",
        "text": header
      },
      "body": {
        "text": msg
      },
      "footer": {
        "text": footer
      },
      "action": {
        "buttons": buttons
      }
    }
  });

  return sendPayload(data, msg, to);
}

function sendList(msg, to, options, header="", footer="") {
  const data = JSON.stringify({
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": to,
    "type": "interactive",
    "interactive": {
      "type": "list",
      "header": {
        "type": "text",
        "text": header
      },
      "body": {
        "text": msg
      },
      "footer": {
        "text": footer
      },
      "action": {
        "sections": options['sections'],
        "button": options['button'],
      }
    }
  });

  return sendPayload(data, msg, to);
}

function sendMessage(msg, to) {
	const data = JSON.stringify({
	  "messaging_product": "whatsapp",
	  "to": to,
	  "type": "text",
    "text": {
    	"body": msg
    }
	});

	return sendPayload(data, msg, to);
}

function sendTemplate(msg, to, template) {
  const data = JSON.stringify({
    "messaging_product": "whatsapp",
    "to": to,
    "type": "template",
    "template": {
      "name": template,
      "language": {
        "code": "en_us"
      },
      "components": [{
          "type": "body",
          "parameters": [{
              "type": "text",
              "text": msg
          }]
      }] 
    }
  });

  return sendPayload(data, msg, to);
}

function sendPayload(data, msg, to) {
	const config = {
	  method: 'post',
	  maxBodyLength: Infinity,
	  url: process.env.WHATSAPP_URL,
	  headers: { 
	    'Content-Type': 'application/json', 
	    'Authorization': 'Bearer ' + auth_token
	  },
	  data: data
	};

	return axios.request(config)
		.then((response) => {
		  console.log("Sent", msg, "to", to);
		  return response.data['messages'][0]['id'];
		})
		.catch((error) => {
		  console.log(error.response.data);
		});
}

module.exports = { sendMessage, sendButtons, sendTemplate, sendList };