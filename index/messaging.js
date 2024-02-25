/**
 * MESSAGES
 **/

const axios = require('axios');
require('dotenv').config();
const auth_token = process.env.AUTH_TOKEN;

function sendMessage(msg, template='question', to=phoneNumber) { // phoneNumber is a global var
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

	const config = {
	  method: 'post',
	  maxBodyLength: Infinity,
	  url: 'https://graph.facebook.com/v18.0/207079465828031/messages',
	  headers: { 
	    'Content-Type': 'application/json', 
	    'Authorization': 'Bearer ' + auth_token
	  },
	  data: data
	};

	axios.request(config)
	.then((response) => {
	  console.log(response.data);
	  return response.data['messages'][0]['id'];
	})
	.catch((error) => {
	  console.log(error.response.data);
	});
}

module.exports = sendMessage;