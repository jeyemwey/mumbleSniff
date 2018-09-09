"use strict";

const
	dotenv = require('dotenv').config(),
	fs = require('fs'),
	mumble = require('mumble'),
	TeleBot = require('telebot'),
	util = require('util');

var options = {
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem')
};

function arr_diff(a1, a2) {
	// Source: http://stackoverflow.com/a/1187628
	var a = [],
		diff = [];

	for (var i = 0; i < a1.length; i++) {
		a[a1[i]] = true;
	}

	for (var i = 0; i < a2.length; i++) {
		if (a[a2[i]]) {
			delete a[a2[i]];
		} else {
			a[a2[i]] = true;
		}
	}

	for (var k in a) {
		diff.push(k);
	}

	return diff;
}
function arr_remove(array, item) {
	let index = array.indexOf(item);
 
  if (index > -1) {
     array.splice(index, 1);
  }

  return array;
}

if (!Array.prototype.includes) {
	// https://tc39.github.io/ecma262/#sec-array.prototype.includes
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement, fromIndex) {

      // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        // c. Increase k by 1.
        // NOTE: === provides the correct "SameValueZero" comparison needed here.
        if (o[k] === searchElement) {
          return true;
        }
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}

function nl2br (str, is_xhtml) {
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

function getUsersFromChannel(connection, channels) {
	console.log(channels);
	var users = [];
	for(let i = 0; i <= channels; i++) {
		console.log(i);
		try
		{
			for (var u in connection._channels[i].users) {
				users.push(connection._channels[i].users[u].name + "");
			}
		}
		catch(e)
		{}
	}
	return users;
}

function ObjectLength( object ) {
    var length = 0;
    for( var key in object ) {
        if( object.hasOwnProperty(key) ) {
            ++length;
        }
    }
    return length;
};

var rootCh, alt;

console.log('MUMBL: Connecting');
mumble.connect('mumble://' + process.env.SERVERURL, options, function(error, connection) {
	if (error) {
		throw new Error(error);
	}

	console.log('MUMBL: Connected');

	connection.authenticate(process.env.MUMBLEUSER);
	connection.on('ready', function() {
		rootCh = connection._channels[2];
		alt = getUsersFromChannel(connection, ObjectLength(connection._channels));

		setInterval(function() {
			var neu = getUsersFromChannel(connection, ObjectLength(connection._channels));
			var diff = arr_diff(alt, neu);
			diff.forEach(function(u) {
				if (alt.includes(u)) { //User ist in alt und nicht in neu
					sendTelegramMessage(u + " has left the server.");
				} else if(neu.includes(u)) { //User ist in neu und nicht in alt
					sendTelegramMessage(u + " has joined the server.");
				}
			});

			alt = neu;
		}, 1000);
	});
	connection.on('message', function(text, user, scope) {
		sendTelegramMessage(user.name + ":\n" + text);
	});
});


var botUsers = [-1001354373323];
var idToName = {};
const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);
bot.connect();
bot.on('connect', function() {console.log("TELEG: Bot is connected.")});
bot.on('reconnected', function() {console.log("TELEG: Bot is reconnected.")});
bot.on('text', function(msg) {
  let fromId = msg.from.id;
  let firstName = msg.from.first_name;

  idToName[fromId] = firstName;

  if(msg.text == '/start') {
  	//Neuer Nutzer, abspeichern
  	if(botUsers.includes(fromId)) {
		bot.sendMessage(fromId, "You have already subscribed. You can quit the subscription with /stop.");
	} else {
		botUsers.push(fromId);
  		console.log("TELEG: " + firstName + " has subscribed.");
  		bot.sendMessage(fromId, "Welcome, " + firstName + "! You are now on the list and will be notified when somebody comes online. You can stop the service with /stop.");
 	}
  } else if(msg.text == '/stop') {
  	//Benutzer abbestellen.
  	arr_remove(botUsers, fromId);
  	console.log("TELEG: " + firstName + " has quit its subscription.");
  	bot.sendMessage(fromId, firstName + ", you have now unsubscribed. You can start the service again with /start.");
  } else if(msg.text == '/list') {
	var firsts = botUsers.map(function(i) {return idToName[i];});
	var message = "Online bei Mumble: " + alt.join(", ") + "\n\nOnline bei Telegram: " + firsts.join(", ");
  	bot.sendMessage(fromId, message);
  } else {
	var message = firstName + ":\n" + msg.text;
	rootCh.sendMessage(nl2br(message));
	sendTelegramMessage(message, fromId);
  }

  fs.writeFileSync("loggedInUsers.log", botUsers.join("\n") + "");
});

function sendTelegramMessage(string, except) {
	console.log("TELEG: " + string);

	botUsers.forEach(function(botUser) {
		if(botUser !== except)
			return bot.sendMessage(botUser, string);
		else return 0;
	});
}
