module.exports = {
	"locations" : {
		"h1" : {
			"name" : "h1.myx.ru",
			"wan3" : "88.198.177.100",
			"wan36" : "2a01:4f8:d1:1d00::100",
			"url" : [
				"https://robot.your-server.de"
			],
			"lan3" : [ 
				"192.168.20.250/24", 
				"192.168.21.250/24", 
				"192.168.22.250/24", 
				"192.168.24.250/24", 
				"192.168.25.250/24", 
				"192.168.26.250/24", 
				"172.16.1.250/24" 
			],
			"tap3" : "10.112.11.20"
		},
		"h2" : {
			"name" : "h2.myx.ru",
			"wan3" : "h2-wan",
			"url" : [
				"https://my.selectel.ru/vpc/projects"
			]
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
			"wan36" : "h5-wan6",
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
		},
		"eu" : {
			"name" : "eu.myx.ru",
			"title" : "EU Root Entry, h1+o3",
			"group" : [
				"h1",
				"o3"
			]
		}
	},
	"servers" : {
		"l6h1.myx.ru" : {
			"disposition" : "guest",
			"router" : "active",
			"location" : "h1",
			"resources" : {	"cpu" : 2,	"ram" : "1024m",	"hdd" : "10G"	},
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
			},
			"tcpShift" : 1000,
			"monitor" : "l6route"
		},
		"l6o3.myx.ru" : {
			"disposition" : "guest",
			"router" : "active",
			"location" : "o3",
			"resources" : {	"cpu" : 2,	"ram" : "1024m",	"hdd" : "10G"	},
			"wan" : {
				"ip" : "l6o3-wan"
			},
			"lan" : {
				"ip" : "192.168.3.254"
			},
			"tap" : { 
				"ip" : "l6o3-tap",
				"key" : "-----BEGIN RSA PUBLIC KEY-----\r\nMIIBCgKCAQEA1u1UJ1/rKCT2pVPgSAvLWeX2RW2e72ObC7xG1YVBMUi1V8JCU0+S\r\ntEaEgNknTxNylJm2OiE50YWXzydDMf+GNq3AEqq/9S9UXRuXQlxSbTe4Ic1odgdi\r\nXMXHdMJu3Q4AOCxu8kEHGR4VelvpprjHyXxEteX/doBSGm4TaomaAT3gI0k5TAol\r\nacjoctu+dgrL1YXA0MtPYAN0JX5yeLA0yX7AKeHfGW5Ws5E5++Y1QdE3XNXxftL4\r\nX9dhOJBziW4TsPYTpair2oLLcmOYihnD6Bbsb87aoaKt6iheEtVzBgluN+qhzCP1\r\nA5XgIlicbLrwHD61o83lpatE/dNDbhKVvQIDAQAB\r\n-----END RSA PUBLIC KEY-----"
			},
			"tcpShift" : 2000,
			"monitor" : "l6route"
		},
		"stdalone1-h1.myx.ru" : {
			"disposition" : "standalone",
			"location" : "h1",
			"resources" : {	"cpu" : 2,	"ram" : "1024m",	"hdd" : "100G"	},
			"wan" : {
				"ip" : "stdalone1-h1.wan",
				"ipv6" : "2a01:4f8:160:30c1:0:0:0:75"
			},
			"lan" : {
				"ip" : "192.168.1.77"
			}
		},
		"stdalone2-h1.myx.ru" : {
			"disposition" : "host",
			"location" : "h1",
			"resources" : {	"cpu" : 2,	"ram" : "1024m",	"hdd" : "100G"	},
			"wan" : {
				"ip" : "stdalone2-h1.wan"
			},
			"lan" : {
				"ip" : "192.168.1.79",
				"ipv6" : "2a01:4f8:160:30c1:0:0:0:76"
			}
		},
		"stdalone3-h1.myx.ru" : {
			"disposition" : "standalone",
			"location" : "h1",
			"resources" : {	"cpu" : 2,	"ram" : "1024m",	"hdd" : "100G"	},
			"wan" : {
				"ip" : "stdalone3-h1.wan",
				"ipv6" : "2a01:4f8:160:30c1:0:0:0:77"
			},
			"lan" : {
				"ip" : "7.7.7.7"
			}
		},
		"ae3.myx.ru" : {
			"location" : "h1"
		},
		"www-h1.myx.ru" : {
			"disposition" : "standalone",
			"location" : "h1",
			"net" : "www",
			"resources" : {	"cpu" : 2,	"ram" : "1024m",	"hdd" : "100G"	},
			"lan" : {
				"mac" : "AA:BB:CC:00:01:01",
				"ip" : "192.168.1.77"
			},
			"tcpShift" : 3000,
			"type" : "ae3bsd",
			"monitor" : "acmcms"
		},
		"www-o3.myx.ru" : {
			"disposition" : "standalone",
			"location" : "o3",
			"net" : "www",
			"resources" : {	"cpu" : 2,	"ram" : "1024m",	"hdd" : "100G"	},
			"lan" : {
				"mac" : "AA:BB:CC:03:01:01",
				"ip" : "192.168.3.77"
			},
			"tcpShift" : 3000,
			"type" : "ae3bsd",
			"monitor" : "acmcms"
		},
		"www-2-o3.myx.ru" : {
			"disposition" : "standalone",
			"location" : "o3",
			"net" : "www",
			"resources" : {	"cpu" : 2,	"ram" : "1024m",	"hdd" : "100G"	},
			"lan" : {
				"mac" : "AA:BB:10:03:01:01",
				"ip" : "10.3.2.77"
			},
			"tcpShift" : 5000,
			"type" : "unix",
			"monitor" : "acmcms"
		},
		"mpxy1.myx.ru" : {
			"disposition" : "other",
			"location" : "h1",
			"net" : "monitoring",
			"wan" : {
				"ip" : "mpxy1-wan"
			},
			"lan" : {
				"ip" : "192.168.1.27"
			}
		},
		"mpxy5.myx.ru" : {
			"disposition" : "other",
			"location" : "h5",
			"net" : [ "monitoring", "www" ],
			"resources" : {	"cpu" : 2,	"ram" : "1024m",	"hdd" : "100G"	},
			"lan" : {
				"mac" : "AA:BB:CC:05:07:07",
				"ip" : "192.168.5.27"
			}
		},
		"mpxy3.myx.ru" : {
			"disposition" : "other",
			"location" : "o3",
			"net" : [ "monitoring", "www" ],
			"resources" : {	"cpu" : 2,	"ram" : "1024m",	"hdd" : "100G"	},
			"lan" : {
				"mac" : "AA:BB:CC:03:07:07",
				"ip" : "192.168.3.27"
			}
		}
	},
	"kvm" : {
		"OSes" : {
			"bsd13" : {
				"install" : "https://download.freebsd.org/ftp/releases/amd64/amd64/ISO-IMAGES/13.0/FreeBSD-13.0-RELEASE-amd64-disc1.iso",
				"ssh" : true,
				"title" : "FreeBSD 13.0"
			},
			"bsd12" : {
				"install" : "https://download.freebsd.org/ftp/releases/amd64/amd64/ISO-IMAGES/12.1/FreeBSD-12.1-RELEASE-amd64-disc1.iso",
				"ssh" : true,
				"title" : "FreeBSD 12.1"
			},
			"ubuntu16" : {
				"install" : "http://releases.ubuntu.com/16.04.3/ubuntu-16.04.3-server-amd64.iso",
				"ssh" : true,
				"title" : "Ubuntu Server LTS"
			},
			"ubuntu18" : {
				"install" : "http://releases.ubuntu.com/18.04/ubuntu-18.04-live-server-amd64.iso",
				"ssh" : true,
				"title" : "Ubuntu Server LTS"
			},
			"win8" : {
				"install" : "manual",
				"rdp" : true,
				"title" : "Windows 8"
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
		"templates" : {
			"default" : {
				"loopCycleMillis" : 300000
			},
			"acmcms" : {
				"extends" : "meloscope-admins",
				"check" : [
					{ "protocol" : "http", "path" : "/check1", "expectCode" : 404 },
					{ "protocol" : "https", "path" : "/check2", "expectCode" : 404 }
				]
			},
			"myx-kvm" : {
				"extends" : "meloscope-admins",
				"check" : { "protocol" : "ssh", "port" : 22, "until" : "tcp-connect" }
			},
			"l6route" : {
				"extends" : "meloscope-admins",
				"check" : [
					{ "protocol" : "http", "path" : "/check1", "expectCode" : 404 },
					{ "protocol" : "https", "port" : 1001, "path" : "/", "expectCode" : 200 },
					{ "protocol" : "http", "path" : "/check1", "expectCode" : 404 },
					{ "protocol" : "ssh", "port" : 22, "until" : "tcp-connect" }
				]
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
		"ssl" : {
			"defaultPreset" : "acme-le-MYX-RU",
			"presets" : {
				"acme-le-MYX-RU" : {
					"type" : "acme-http-01",
					"acme" : "letsencrypt",
					"master" : "l6o3.myx.ru",
					"email" : "myx@myx.ru",
					"keySize": "2048",
					"subject" : "/C=RU/ST=RU/OU=MyX/CN=${CN}/ext:subjectAltName=DNS:${CN}"
				}
			}
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
			},
			".slb.myx.ru" : {
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
			],
			"monitor" : "acmcms"
		},
		"web.myx.ru" : {
			"target" : "l6.myx.ru",
			"monitor" : "acmcms"
		},
		"zyx.myx.ru" : {
			"target" : "zyxel.myx.ru",
			"monitor" : "acmcms"
		},
		"zyxel.myx.ru" : {
			"proxyHttp" : "http://zyxel.ru",
			"proxyHttps" : "https://zyxel.ru"
		},
		"mpxy-direct.myx.ru" : {
			"target" : ["mpxy1.myx.ru", "mpxy3.myx.ru", "mpxy5.myx.ru"],
			"dns" : "direct"
		},
		"mpxy-default.myx.ru" : {
			"target" : ["mpxy1.myx.ru", "mpxy3.myx.ru", "mpxy5.myx.ru"]
		},
		"mpxy-router.myx.ru" : {
			"target" : ["mpxy1.myx.ru", "mpxy3.myx.ru", "mpxy5.myx.ru"],
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
		
		"eu-web" : {
			"target" : [
				"h1.myx.ru",
				"h5.myx.ru",
				"o3.myx.ru"
			]
		},
		
		"eu.site" : {
			"location" : "eu-web",
			"target" : [
				"bcp-h1.myx.ru",
				"bcp-o3.myx.ru",
				"bcp-aw.myx.ru"
			]
		}
	},
};
