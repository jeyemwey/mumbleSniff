var mumble = require('mumble'), fs = require('fs');

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

// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
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

function getUsersFromChannel(channel) {
	var users = [];
	for (var u in channel.users) {
		users.push(channel.users[u].name + "");
	}
	return users;
}

console.log('Connecting');
mumble.connect('mumble://paulsurrey.de', options, function(error, connection) {
	if (error) {
		throw new Error(error);
	}

	console.log('Connected');

	connection.authenticate('mumbleBot');
	connection.on('ready', function() {
		var alt = getUsersFromChannel(connection.rootChannel);

		setInterval(function() {
			var neu = getUsersFromChannel(connection.rootChannel);
			console.log(neu);

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
});


function sendTelegramMessage(string) {
	console.log("TELEG: " + string);
}