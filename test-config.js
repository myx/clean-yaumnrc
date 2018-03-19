module.exports = {
	"locations" : {
		"h1" : {
			"name" : "h1.myx.ru",
			"wan3" : "h1-wan",
			"lan3" : "192.168.1.250",
			"tap3" : "10.112.11.20"
		},
		"h2" : {
			"name" : "h2.myx.ru",
			"wan3" : "h2-wan"
		},
		"o3" : {
			"name" : "o3.myx.ru",
			"wan3" : "o3-wan",
			"lan3" : [
				"192.168.3.250", 
				"010.001.002.001/16", 
				"10.2.2.2/16", 
				{
					"key": "lan323",
					"ip" : "10.3.2.3/16"
				}
			],
			"tap3" : "10.112.21.20" 
		},
		"h5" : {
			"name" : "h5.myx.ru",
			"wan3" : "h5-wan",
			"lan3" : "192.168.5.250",
			"tap3" : "10.112.55.20"
		},
		"g1" : {
			"name" : "g1.myx.ru",
			"title" : "GCP (Google Cloud Platform)"
		},
		"a1" : {
			"name" : "a1.myx.ru",
			"title" : "AWS (Amazon Web S?)"
		}
	},
	"servers" : {
		"l6h1.myx.ru" : {
			"router" : "active",
			"location" : "h1",
			"wan" : {
				"ip" : "l6h1-wan"
			},
			"lan" : {
				"mac" : "AA:BB:CC:DD:EE:FF",
				"ip" : "192.168.1.254"
			},
			"tap" : { 
				"ip" : "l6h1-tap",
				"key" : "-----BEGIN RSA PUBLIC KEY-----\r\nMIIBCgKCAQEA1u1UJ1/rKCT2pVPgSAvLWeZ2RW2e72ObC7xG1YVBMUi1V8JCU0+S\r\ntEaEgNknTxNylJm2OiE50YWZzydDMf+GNq3AEqq/9S9UZRuZQlxSbTe4Ic1odgdi\r\nXMZHdMJu3Q4AOCxu8kEHGR4VelvpprjHyZxEteZ/doBSGm4TaomaAT3gI0k5TAol\r\nacjoctu+dgrL1YZA0MtPYAN0JX5yeLA0yZ7AKeHfGW5Ws5E5++Y1QdE3XNXxftL4\r\nX9dhOJBziW4TsPYTpair2oLLcmOYihnD6Bbsb87aoaKt6iheEtVzBgluN+qhzCP1\r\nA5ZgIlicbLrwHD61o83lpatE/dNDbhKVvQIDAQAB\r\n-----END RSA PUBLIC KEY-----"
			}
		},
		"l6o3.myx.ru" : {
			"router" : "active",
			"location" : "o3",
			"wan" : {
				"ip" : "l6o3-wan"
			},
			"lan" : {
				"ip" : "192.168.3.254"
			},
			"tap" : { 
				"ip" : "l6o3-tap",
				"key" : "-----BEGIN RSA PUBLIC KEY-----\r\nMIIBCgKCAQEA1u1UJ1/rKCT2pVPgSAvLWeX2RW2e72ObC7xG1YVBMUi1V8JCU0+S\r\ntEaEgNknTxNylJm2OiE50YWXzydDMf+GNq3AEqq/9S9UXRuXQlxSbTe4Ic1odgdi\r\nXMXHdMJu3Q4AOCxu8kEHGR4VelvpprjHyXxEteX/doBSGm4TaomaAT3gI0k5TAol\r\nacjoctu+dgrL1YXA0MtPYAN0JX5yeLA0yX7AKeHfGW5Ws5E5++Y1QdE3XNXxftL4\r\nX9dhOJBziW4TsPYTpair2oLLcmOYihnD6Bbsb87aoaKt6iheEtVzBgluN+qhzCP1\r\nA5XgIlicbLrwHD61o83lpatE/dNDbhKVvQIDAQAB\r\n-----END RSA PUBLIC KEY-----"
			}
		},
		"stdalone1-h1.myx.ru" : {
			"location" : "h1",
			"wan" : {
				"ip" : "stdalone1-h1.wan"
			},
			"lan" : {
				"ip" : "192.168.1.77"
			}
		},
		"stdalone2-h1.myx.ru" : {
			"location" : "h1",
			"wan" : {
				"ip" : "stdalone2-h1.wan"
			},
			"lan" : {
				"ip" : "192.168.1.79"
			}
		},
		"stdalone3-h1.myx.ru" : {
			"location" : "h1",
			"wan" : {
				"ip" : "stdalone3-h1.wan"
			},
			"lan" : {
				"ip" : "7.7.7.7"
			}
		},
		"ae3.myx.ru" : {
			"location" : "h1"
		},
		"www-h1.myx.ru" : {
			"location" : "h1",
			"net" : "www",
			"lan" : {
				"mac" : "AA:BB:CC:00:01:01",
				"ip" : "192.168.1.77"
			},
			"tcpShift" : 3000,
			"type" : "ae3bsd"
		},
		"www-o3.myx.ru" : {
			"location" : "o3",
			"net" : "www",
			"lan" : {
				"mac" : "AA:BB:CC:03:01:01",
				"ip" : "192.168.3.77"
			},
			"tcpShift" : 3000,
			"type" : "ae3bsd"
		},
		"www-2-o3.myx.ru" : {
			"location" : "o3",
			"net" : "www",
			"lan" : {
				"mac" : "AA:BB:10:03:01:01",
				"ip" : "10.3.2.77"
			},
			"tcpShift" : 3000,
			"type" : "unix"
		},
		"mpxy1.myx.ru" : {
			"location" : "h1",
			"net" : "monitoring",
			"wan" : {
				"ip" : "mpxy1-wan"
			},
			"lan" : {
				"ip" : "192.168.1.27"
			}
		},
		"mpxy3.myx.ru" : {
			"location" : "o3",
			"net" : [ "monitoring", "www" ],
			"lan" : {
				"mac" : "AA:BB:CC:03:07:07",
				"ip" : "192.168.3.27"
			}
		}
	},
	"monitoring" : {
		"settings" : {
			"intervalMillis" : "30000"
		},
		"tests" : {
			"tcp" : {
				"timeoutMillis" : "5000"
			},
			"web" : {
				"timeoutMillis" : "10000"
			}
		},
		"notify" : {
			"myx" : {
				"type" : "email",
				"name" : "Alexander Kharichev",
				"email" : "myx@ndmsy123stems.com",
				"redirect" : "myx-tst"
			},
			"myx-sms" : {
				"type" : "sms",
				"name" : "Alexander Kharichev",
				"phone" : "+79037750402",
				"redirect" : "myx-tst"
			},
			"liepe" : {
				"type" : "email",
				"name" : "Alexandra Platonova",
				"email" : "a.platonova@ndm123systems.com"
			},
			"liepe-sms": {
				"type": "sms",
				"name": "Alexandra Platonova",
				"phone": "+79262043368"
			},
			"myx-all" : {
				"type" : "group",
				"name" : "MyX (sms + email)",
				"list" : [ "myx", "myx-sms" ]
			},
			"ndm-adm" : {
				"type" : "group",
				"name" : "NDM Admins",
				"list" : [ "myx", "liepe", "myx-tst" ]
			},
			
			
			"myx-tst" : {
				"type" : "email",
				"name" : "Alexander Kharichev",
				"email" : "myx@melo123scope.com",
				"testing" : true
			},
			"vla-tst" : {
				"type" : "email",
				"name" : "Vladislav Kharichev",
				"email" : "vlapan@vla123pan.com",
				"testing" : true
			},
			
			
			"testing" : {
				"type" : "group",
				"name" : "Testing",
				"list" : [ "myx-tst", "vla-tst" ]
			}
		},
		"presets" : {
			"build-srv" : {
				"notify" : [ "build" ],
				"expectCode" : 404
			}
		}
	},
	"routing" : {
		"types" : {
			"default" : {
				"level3" : {},
				"level6" : {}
			},
			"ae3bsd" : {
				"level3" : {
					"22/tcp"  : 22,
					"53"      : 53,
					"44"      : 4044,
					"45"      : 17045,
					"47"      : 17047,
					"80/tcp"  : 17080,
					"122/tcp" : 17022,
					"443/tcp" : 17443
				},
				"level6" : {
					"plain"  : 17080,
					"secure" : 17081
				}
			},
			"maersk" : {
				"level3" : {
					"21/tcp"   : 22,
					"22/tcp"   : 10022,
					"81/tcp"   : 10080,
					"83/tcp"   : 10443,
					"11/tcp"   : 41011,
					"12/tcp"   : 18012,
					"13/tcp"   : 23013,
					"14/tcp"   : 18014,
					"15/tcp"   : 41015,
					"16/tcp"   : 23016,
					"23/tcp"   : 18023,
					"222/tcp"  : 23222,
					"5000/tcp" : 5000,
					"5001/tcp" : 5001
				},
				"level6" : {
					"plain"  : 10000,
					"secure" : 10080
				}
			},
			"unix" : {
				"level3" : {
					"22/tcp"  : 22,
					"53"      : 53,
					"80/tcp"  : 80,
					"82"      : 82,
					"443/tcp" : 443
				},
				"level6" : {
					"plain"  : 80,
					"secure" : 80
				}
			},
		},
		"domains" : {
			".myx.co.nz" : {
				"mode" : "infrastructure"
			},
			".myx.ru" : {
				"mode" : "infrastructure",
				"dns" : {
					"A" : {
						"*" : "5.9.34.107",
						"@" : "5.9.100.81"
					},
					"CNAME" : {
						"cgit.myx.co.nz." : "yandex.googlehosted.com."
					}
				}
			},
			".ded.myx.ru" : {
				"mode" : "dedicated",
				"dns" : {
					"A" : {
						"*" : "5.9.34.107",
						"@" : "5.9.100.81"
					},
					"CNAME" : {
						"cgit.myx.co.nz." : "yandex.googlehosted.com."
					}
				}
			},
			".del.myx.ru" : {
				"mode" : "delegated",
				"servers" : [
					"ns1.keen.com", 
					"ns2.keen.com"
				]
			},
			".sta.myx.ru" : {
				"mode" : "static",
				"dns" : {
					"NS" : {
						"@" : [
							"l3o1.ndm9.net.",
							"l3h1.ndm9.net.",
							"l3r2.ndm9.net."
						]
					},
					"A" : {
						"*" : "55.9.34.107",
						"@" : "55.9.100.81"
					},
					"AAAA" : {
						"@"   : "2a01:4f8:160:30c1:0:0:0:2",
						"www" : "2a01:4f8:160:30c1:0:0:0:2"
					},
					"MX" : {
						"@" : [
							"5 aspmx.l.google.com.",
							"10 alt1.aspmx.l.google.com.",
							"15 alt2.aspmx.l.google.com."
						]
					},
					"CNAME" : {
						"zinka.sta.myx.ru." : "www.microsoft.com."
					}
				}
			},
			".sla.myx.ru" : {
				"mode": "slave",
				"masters": ["5.9.100.67", "172.16.111.11", "172.16.121.11"]
			}
		}
	},
	"targets" : {
		"h1.myx.ru" : {
			"target" : "l6h1.myx.ru"
		},
		"o3.myx.ru" : {
			"location" : "o3",
			"target" : "l6o2.myx.ru",
			"dns" : "use-router",
			"ssl" : "strong"
		},
		"l6o3.myx.ru" : {
			"target" : "l6o3.myx.ru",
			"ssl" : "strong"
		},
		"l6.myx.ru" : {
			"target" : [ "l6h1.myx.ru", "l6o3.myx.ru" ]
		},
		"stdalone2-h1.myx.ru" : {
			"target" : "stdalone2-h1.myx.ru",
			"dns" : "ignore-wan"
		},
		"stdalone3-h1.myx.ru" : {
			"target" : "stdalone2-h1.myx.ru",
			"dns" : "ignore-wan"
		},
		"stdalone.myx.ru" : {
			"target" : [
				"stdalone1-h1.myx.ru", 
				"stdalone2-h1.myx.ru", 
				"stdalone3-h1.myx.ru"
			]
		},
		"www.myx.ru" : {
			"target" : [
				"www-h1.myx.ru",
				"www-o3.myx.ru"
			]
		},
		"web.myx.ru" : {
			"target" : "l6.myx.ru"
		},
		"zyx.myx.ru" : {
			"target" : "zyxel.myx.ru"
		},
		"zyxel.myx.ru" : {
			"proxyHttp" : "http://zyxel.ru",
			"proxyHttps" : "https://zyxel.ru"
		},
		"mpxy-direct.myx.ru" : {
			"target" : ["mpxy1.myx.ru", "mpxy3.myx.ru"],
			"dns" : "direct"
		},
		"mpxy-default.myx.ru" : {
			"target" : ["mpxy1.myx.ru", "mpxy3.myx.ru"]
		},
		"mpxy-router.myx.ru" : {
			"target" : ["mpxy1.myx.ru", "mpxy3.myx.ru"],
			"dns" : "use-router"
		},
		"mpxy-def-h1l.myx.ru" : {
			"location" : "h1",
			"target" : ["mpxy1.myx.ru", "mpxy3.myx.ru"]
		},
		"capandcap.ru" : {
			"proxyHttp" : "http://capandcap.ru",
			"proxyHttps" : "https://canandcap.ru"
		},
		"bcp-h1.myx.ru" : {
			"location" : "h1",
			"proxyHttp" : "http://maersk.myx.ru:5001", 
			"proxyHttps" : "http://maersk.myx.ru:5001",
			"ssl" : "ndm-strong-VG"
		},

		"bcp-aw.myx.ru" : {
			"proxyHttp" : "http://buildproxy-env.eu-central-1.elasticbeanstalk.com", 
			"proxyHttps" : "http://buildproxy-env.eu-central-1.elasticbeanstalk.com",
			"ssl" : "ndm-strong-VG"
		},


		"bcp-o3.myx.ru" : {
			"location" : "o3",
			"proxyHttp" : "http://sovtransavto.myx.ru:5001", 
			"proxyHttps" : "http://sovtransavto.myx.ru:5001",
			"ssl" : "ndm-strong-VG"
		},

		"bcp.myx.ru" : {
			"target" : [
				"bcp-h1.myx.ru",
				"bcp-o3.myx.ru",
				"bcp-aw.myx.ru"
			]
		},
	},
};
