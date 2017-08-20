var x = require('./index').parse({
	locations : {
		tl1 : {
			name : "tl1",
			"title" : "Test Location 1 ",
			"routing" : {
				"gateway":{
					"ip" : "127.0.0.254"
				},
				"external" : {
					"ip" : "127.0.0.253"
				}
			}
		}
	},
	servers : {
		ts1 : {
		},
		ts2 : {
			location : "tl1",
			lan : {
				ip : "127.0.0.2",
				mac  : "00:11:22:33:44:55"
			}
		},
		ts3 : {
			location : "tl1",
			lan : {
				ip : "127.0.0.3",
				mac  : "00:11:22:33:44:56",
				dhcp : {
					routes : {
						static : [
							{
								dst : "127.0.0.2",
								via : "127.0.0.254"
							},
							{
								dst : "8.8.4.4",
								via : "127.0.4.4"
							}
						]
					}
				}
			}
		}
	},
	targets : {
		tt1 : {
		}
	}
});

console.log("parsed: " + x);