var x = require('./index').parse({
	locations : {
		tl1 : {
		}
	},
	servers : {
		ts1 : {
		}
	},
	targets : {
		tt1 : {
		}
	}
});

console.log("parsed: " + x);