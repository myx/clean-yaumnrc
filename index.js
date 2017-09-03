const f = {
	defineProperty : function(o, n, v){
		Object.defineProperty(o, n, { value : v	});
	},
	defineClass : function(name, inherit, constructor, properties, statics){
		constructor.prototype = inherit
			? Object.create(inherit.prototype || inherit)
			: {};
		if(properties){
			Object.defineProperties(constructor.prototype, properties);
		}
		if(name && !(properties && properties[name])){
			f.defineProperty(constructor.prototype, name, constructor);
		}
		if(statics){
			Object.defineProperties(constructor, statics);
		}
		if(name && !(statics && statics["toString"])){
			f.defineProperty(constructor, "toString", function(){
				return "[class " + name + "]";
			});
		}
		return constructor;
	},
	parseNetwork : function(cidr, mac, defaultBits){
		if(!cidr){
			return undefined;
		}
		if(cidr.AbstractAddress){
			return cidr;
		}
		if(cidr.ip){
			return f.parseNetwork(cidr.ip, cidr.mac);
		}
		const pos = cidr.indexOf('/');
		if(pos === -1){
			if(!defaultBits || defaultBits === 32){
				return new SingleAddress(cidr, mac);
			}
			return new NetworkAddress(
				cidr + '/' + defaultBits, 
				cidr, 
				defaultBits, 
				mac);
		}
		{
			const bits = parseInt(cidr.substr(pos+1));
			return new NetworkAddress(cidr, cidr.substr(0, pos), bits, mac);
		}
	}
};

const AbstractAddress = f.defineClass(
	"AbstractAddress",
	undefined,
	function(){
		return this;
	}, {
		"ip" : {
			value : null
		},
		"mac" : {
			value : null
		},
		"intIPv4" : {
			get : function(){
				return AbstractAddress.intForIPv4(this.ip);
			}
		},
		"strIPv4" : {
			get : function(){
				return AbstractAddress.intToIPv4(AbstractAddress.intForIPv4(this.ip));
			}
		},
		"containsIp" : {
			value : function(ip){
				return this.ip === ip;
			}
		},
		"filterIp" : {
			value : function(ip){
				return this.containsIp(ip) ? ip : undefined;
			}
		},
		"toString" : {
			value : function(){
				return "[AbstractAddress]";
			}
		}
	}, {
		"intForIPv4" : {
			value : function(IPv4){
				if('string' === typeof IPv4){
					return IPv4.split('.').reduce(function(r, v){
						return (r * 256) + parseInt(v);
					}, 0);
				}
				if('number' === typeof IPv4){
					return IPv4;
				}
				throw new Error("Invalid IP: " + IPv4);
			}
		},
		"intToIPv4" : {
			value : function(uint){
				return "" 
					+ ((uint >> 24) & 0xff)
					+ "."
					+ ((uint >> 16) & 0xff)
					+ "."
					+ ((uint >> 8) & 0xff)
					+ "."
					+ ((uint >> 0) & 0xff)
				;
			}
		}
	}
);

const SingleAddress = f.defineClass(
	"SingleAddress", 
	AbstractAddress, 
	function(ip, mac){
		Object.defineProperties(this, {
			"ip" : {
				value : ip
			},
			"mac" : {
				value : mac
			}
		});
		return this;
	}, {
		"toSourceObject" : {
			value : function(){
				return this.mac
					? { "mac" : this.mac, "ip" : this.ip }
					: this.ip;
			}
		},
		"toString" : {
			value : function(){
				return "[SingleAddress "+this.ip+"]";
			}
		}
	}, {
		"LOCALHOST" : {
			configurable : true,
			get : function(){
				return SingleAddress.LOCALHOST = new SingleAddress(
					"127.0.0.1"
				);
			}
		}
	}
);


const NetworkAddress = f.defineClass(
	"NetworkAddress",
	AbstractAddress,
	function(cidr, ip, bits, mac){
		const mask = (0xFFFFFFFF * Math.pow(2, 32 - bits)) % 0x100000000;
		const network = AbstractAddress.intForIPv4(ip) & mask
		Object.defineProperties(this, {
			"cidr" : {
				value : cidr
			},
			"ip" : {
				value : ip
			},
			"networkInt" : {
				value : network
			},
			"mac" : {
				value : mac
			},
			"bits" : {
				value : bits
			},
			"maskInt" : {
				value : mask
			}
		});
		return this;
	}, {
		"network" : {
			get : function(){
				return this.network = AbstractAddress.intToIPv4(this.networkInt);
			}
		},
		"mask" : {
			get : function(){
				return this.mask = AbstractAddress.intToIPv4(0xFFFFFFFF & this.maskInt) 
			}
		},
		"list" : {
			get : function(){
				return [ this ];
			}
		},
		"containsIp" : {
			value : function(ip){
				return (AbstractAddress.intForIPv4(ip) & this.maskInt) == this.networkInt;
			}
		},
		"networkForIp" : {
			value : function(ip){
				if(this.containsIp(ip)){
					return this;
				}
				return undefined;
			}
		},
		"toSourceObject" : {
			value : function(){
				return this.mac
					? { "mac" : this.mac, "ip" : this.cidr }
					: this.cidr;
			}
		},
		"toString" : {
			value : function(){
				return "[NetworkAddress "+this.cidr+"]";
			}
		}
	}, {
		"GLOBAL" : {
			configurable : true,
			get : function(){
				return NetworkAddress.GLOBAL = new NetworkAddress(
					"0.0.0.0/0", 
					"0.0.0.0", 
					0
				);
			}
		}
	}
);


const Networks = f.defineClass(
	"Networks",
	AbstractAddress,
	function(cidrArray){
		Object.defineProperties(this, {
			"cidrs" : {
				value : cidrArray ? [].concat(cidrArray) : []
			},
		});
		return this;
	}, {
		"addNetwork" : {
			value : function(net){
				this.cidrs.push(net);
				delete this.list;
				return this;
			}
		},
		"list" : {
			get : function(){
				if(!this.cidrs){
					throw new Error("This ia an instance method!");
				}
				return this.list = this.cidrs.reduce(function(r,v){
					const net = f.parseNetwork(v);
					net && r.push(net);
					return r;
				}, []);
			}
		},
		"cidrs" : {
			value : undefined
		},
		"ip" : {
			value : function(){
				return "127.0.0.1";
			}
		},
		"containsIp" : {
			value : function(ip){
				for(let net of this.list){
					if(net.containsIp(ip)){
						return true;
					}
				}
				return false;
			}
		},
		"filterIp" : {
			value : function(ip, any){
				if(any){
					return this.containsIp(ip) ? ip : undefined;
				}
				for(let net of this.list){
					if(!net.containsIp(ip)){
						return undefined;
					}
				}
				return ip;
			}
		},
		"networkForIp" : {
			value : function(ip){
				for(var net of this.list){
					if(net.containsIp(ip)){
						return net;
					}
				}
				return undefined;
			}
		},
		"toSourceObject" : {
			value : function(){
				return this.cidrs;
			}
		},
		"toString" : {
			value : function(){
				return "[Networks ("+this.cidrs+")]";
			}
		}
	}, {
		"LOCAL" : {
			configurable : true,
			get : function(){
				return Networks.LOCAL = new Networks([
					"10.0.0.0/8",
					"172.16.0.0/12",
					"192.168.0.0/16"
				]);
			}
		}
	}
);

const ListAndMap = f.defineClass(
	"ListAndMap",
	undefined,
	function(){
		Object.defineProperties(this, {
			"list" : {
				value : []
			},
			"map" : {
				value : {}
			},
			"idx" : {
				value : {}
			},
		});
		return this;
	}, {
		"isEmpty" : {
			value : function(){
				return this.list.length == 0;
			}
		},
		"list" : {
			// instance list (items accessible by index, Array)
			value : null
		},
		"map" : {
			// instance map (items accessible by key, Object)
			value : null
		},
		"keys" : {
			// returns array of all map keys, Array
			get : function(){
				return Object.keys(this.map);
			}
		},
		"idx" : {
			// instance map (item array index by key, Object)
			value : null
		},
		"put" : {
			value : function(key, value){
				const idx = this.idx[key];
				if('number' === typeof idx){
					this.list[idx] = value;
					this.map[key] = value;
					return;
				}
				this.idx[key] = this.list.length;
				this.map[key] = value;
				this.list.push(value);
				return;
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc ListAndMap(" + this.list.length + ", [" + Object.keys(this.idx) + "])]";
			}
		}
	}
);



const Location = f.defineClass(
	"Location",
	undefined,
	function(config, key, source){
		
		const wan3 = source.wan3;
		const wan6 = source.wan6 || wan3;
		const tap3 = source.tap3;
		
		const self = this;
		const lans = [].concat(
			source.lan3
		).reduce(function(r, x){ 
			if(x){
				const lan = f.parseNetwork(x, undefined, 24);
				if(lan){
					lan.location = self;
					if(!r){
						return lan;
					}
					if(r.Networks){
						r.addNetwork(lan);
					}else{
						r = new Networks().addNetwork(r);
					}
				}
			}
			return r;
		}, undefined);

		Object.defineProperties(this, {
			"config" : {
				value : config
			},
			"key" : {
				value : key
			},
			"wan3" : {
				value : wan3
			},
			"wan6" : {
				value : wan6
			},
			"lans" : {
				value : lans
			},
			"tap3" : {
				value : tap3
			},
			"name" : {
				value : source.name || key
			},
			"title" : {
				value : source.title || source.name || key
			},
			"servers" : {
				value : new ListAndMap()
			},
			"routers" : {
				value : new ListAndMap()
			},
			"source" : {
				value : source
			},
		});
		return this;
	},{
		"wan6" : {
			// Array of external IPs for Layer6 access 
			value : null
		},
		"wan3" : {
			// external IP for Layer3 access (gateway - only one IP per location)
			value : null
		},
		"lans" : {
			// Array of local Netrowks for Layer3 access
			value : null
		},
		"lan3" : {
			// Array of local IPs for Layer3 access (gateway, dns-server) 
			get : function(){
				if(this.lans){
					if(this.lans.ip){
						return [ this.lans.ip ];
					}
					if(this.lans.list){
						return this.lans.list.reduce(function(r, x){ 
							x.ip && r.push(x.ip);
							return r; 
						}, []);
					}
				}
				return undefined;
			}
		},
		"tap3" : {
			// Array of local IPs for Layer3 access (tap to inter-cluster vpn) 
			value : null
		},
		"buildDnsViewIP4" : {
			value : function(net/*, location*/){
				if(null !== net && this.lan3 && net.location === this){
					const result = this.lan3.reduce(function(r,x){
						const lan3 = net.filterIp(x);
						lan3 && (r || (r = [])).push(lan3);
						return r;
					}, null);
					if(result){
						return result;
					}
				}
				{
					if(this.wan3){
						return [].concat(this.wan3);
					}
				}

				const result = {};

				for(var i of this.routers.list){
					if(i.router === 'active'){
						for(const i of (i.buildDnsViewIP4(net, true) || [])){
							result[i] = true;
						}
					}
				}
				if(result.length == 0) for(var i of this.routers.list){
					if(i.router === 'testing'){
						for(const i of (i.buildDnsViewIP4(net, true) || [])){
							result[i] = true;
						}
					}
				}
				return Object.keys(result);
			}
		},
		"wan3smart" : {
			// Array of external IPs for Layer3 access (length is likely 1 or 0, but could have several WAN IPs of all the routers) 
			get : function(){
				return this.buildDnsViewIP4(null);
			}
		},
		"lan3smart" : {
			// Array of local IPs for Layer3 access (length is likely 1 or 0, but could have several LAN IPs of all the routers) 
			get : function(){
				return this.buildDnsViewIP4(this.config.location && this.config.location.lans || null);
			}
		},
		"tap3smart" : {
			// Array of local IPs for internal VPN access (length is likely 1 or 0, but could have several TAP IPs of all the routers) 
			get : function(){
				if(this.tap3){
					return [].concat(this.tap3);
				}
				const result = [];
				for(var i of this.routers.list){
					if((i.router === 'active' || i.router === 'testing') && i.tap3){
						result.push(i.tap3);
					}
				}
				return result;
			}
		},
		"key" : {
			// key of given instance 
			value : null
		},
		"name" : {
			// name or key of given instance 
			value : null
		},
		"title" : {
			// title, name or key of given instance 
			value : null
		},
		"servers" : {
			// ListAndMap instance 
			value : null
		},
		"routers" : {
			// ListAndMap instance 
			value : null
		},
		"findLanForClient" : {
			value : function(ip){
				return this.lans.networkForIp(ip);
			}
		},
		"findGatewayForClient" : {
			value : function(ip){
				const lan = this.lans.networkForIp(ip);
				return lan ? lan.ip : undefined;
			}
		},
		"source" : {
			// the source 'settings' object, from which this object was constructed
			value : null
		},
		"toSourceObject" : {
			value : function(){
				return {
					"name" : this.name || null,
					"title" : (this.source.title || this.title !== this.name) && this.title || undefined,
					"wan3" : this.wan3 || null,
					"lan3" : this.lans && this.lans.length && this.lans.map(function(x){return x.toSourceObject();}) || null,
					"tap3" : this.tap3 || undefined,
				};
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc Location(" + this.title + ")]";
			}
		}
	}
);







const Server = f.defineClass(
	"Server",
	undefined,
	function(config, key, source){
		Object.defineProperties(this, {
			"config" : {
				value : config
			},
			"key" : {
				value : key
			},
			"wan3" : {
				value : source.wan && source.wan.ip
			},
			"lan3" : {
				value : source.lan && source.lan.ip
			},
			"source" : {
				value : source
			},
		});
		source && source.dns && Object.defineProperties(this, {
			"modeDns" : {
				value : source.dns
			},
		});
		return this;
	}, {
		"key" : {
			// key of given instance 
			value : null
		},
		"wan3" : {
			// null or Array of external IPs for Layer3 access 
			value : null
		},
		"lan3" : {
			// null or Array of local network IPs for Layer3 access 
			value : null
		},
		"location" : {
			get : function(){
				return this.config.locations.map[this.source.location];
			}
		},
		"selected" : {
			get : function(){
				return this == this.config.server;
			}
		},
		"modeDns" : {
			// to be functionally compatible with Target objects
			value : null
		},
		"wan3smart" : {
			get : function(){
				return this.buildDnsViewIP4(null);
			}
		},
		"lan3smart" : {
			// Array of local IPs for Layer3 access (length is likely 1 or 0, but could have several LAN IPs of all the routers) 
			get : function(){
				return this.buildDnsViewIP4(this.config.location && this.config.location.lans || null);
			}
		},
		"endpointsToMap" : {
			// to be functionally compatible with Target objects
			value : function(mapInitial){
				const map = mapInitial || {};
				map[this.key] = this;
				return map;
			}
		},
		"endpointsMap" : {
			// to be functionally compatible with Target objects
			get : function(){
				return this.endpointsToMap({});
			}
		},
		"endpointsList" : {
			// to be functionally compatible with Target objects
			get : function(){
				return [ this ];
			}
		},
		"upstreamList" : {
			// to be functionnally compatible with Target objects
			get : function(){
				return [ new UpstreamObject() ];
			}
		},
		"buildDirectIP4" : {
			value : function(net){
				const a = null === net
					? this.wan3
					: this.lan3 && net.filterIp(this.lan3) || this.wan3
				;
				return a ? [ a ] : undefined;
			}
		},
		"buildDnsViewIP4" : {
			value : function(net, own, parent/*, location*/){
				const modeDns = parent && (parent.modeDns || 'default') || this.modeDns || 'direct';
				if(modeDns === "use-wan"){
					const a = this.buildDirectIP4(null);
					if(a){
						return a;
					}
				}
				if(modeDns === "direct"){
					const a = this.buildDirectIP4(net);
					if(a){
						return a;
					}
				}
				if(own){
					return undefined;
				}
				if(this.location){
					return this.location.buildDnsViewIP4(net);
				}
				return this.config.buildDnsViewIP4(net);
			}
		},
		"source" : {
			// the source 'settings' object, from which this object was constructed
			value : null
		},
		"toSourceObject" : {
			value : function(){
				return this.source;
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc Server(" + this.key + ")]";
			}
		}
	}
);






const Router = f.defineClass(
	"Router",
	Server,
	function(config, key, source){
		this.Server(config, key, source);
		Object.defineProperties(this, {
			"router" : {
				value : source.router
			},
			"tap3" : {
				value : source.tap && source.tap.ip
			},
		});
		return this;
	}, {
		"router" : {
			// the 'router' mode attribute ('active', 'testing', 'enabled', ...)
			value : null
		},
		"tap3" : {
			// null or Array of tinc-tap network IPs for Layer3 access 
			value : null
		},
		"toString" : {
			value : function(){
				return "[yamnrc Router(" + this.key + ")]";
			}
		}
	}
);










const Target = f.defineClass(
	"Target",
	undefined,
	function(config, key, source){
		Object.defineProperties(this, {
			"config" : {
				value : config
			},
			"key" : {
				value : key
			},
			"location" : {
				value : source.location && config.locations.map[source.location]
			},
			"source" : {
				value : source
			},
		});
		source && source.dns && Object.defineProperties(this, {
			"modeDns" : {
				value : source.dns
			},
		});
	
		return this;
	}, {
		"key" : {
			// key of given instance 
			value : null
		},
		"modeDns" : {
			// null, 'use-wan', 'use-router', 'direct', 'local', 'remote', 'static'
			value : null
		},
		"endpointsToMap" : {
			value : function(mapInitial){
				// abstract
				return mapInitial || {};
			}
		},
		"endpointsMap" : {
			get : function(){
				return this.endpointsToMap({});
			}
		},
		"endpointsList" : {
			get : function(){
				return Object.values(this.endpointsMap);
			}
		},
		"upstreamList" : {
			// to be functionnally compatible with Target objects
			get : function(){
				return [ new UpstreamObject() ];
			}
		},
		"hasLocalEndpoints" : {
			get : function(){
				for(const target of this.endpointsList){
					if(!target.location || target.location === this.config.location){
						return true;
					}
				}
				return false;
			}
		},
		"wan3smart" : {
			get : function(){
				return this.buildDnsViewIP4(null);
			}
		},
		"lan3smart" : {
			get : function(){
				return this.buildDnsViewIP4(this.config.location && this.config.location.lans || null);
			}
		},
		"buildDirectIP4" : {
			value : function(net){
				const map = {};
				for(const t of this.endpointsList){
					const lan3 = null !== net && t.lan3 && net.filterIp(t.lan3);
					(lan3 && (map[lan3] = true)) ||
						(t.wan3 && (map[t.wan3] = true))
					;
				}
				const keys = Object.keys(map);
				return keys.length ? keys : undefined;
			}
		},
		"buildDnsViewIP4" : {
			value : function(net, own, parent/*, location*/){
				const modeDns = parent && parent.modeDns || this.modeDns;
				if(modeDns === "use-router"){
					if(this.location){
						return this.location.buildDnsViewIP4(net);
					}
				}
				if(modeDns === "direct"){
					const result = this.buildDirectIP4(net);
					if(result){
						return result;
					}
				}
				const map = {};
				if(modeDns === "use-wan"){
					const result = this.buildDirectIP4(null);
					if(result){
						return result;
					}
					if(this.location){
						return this.location.buildDnsViewIP4(null);
					}
					for(const t of this.endpointsList){
						for(const a of (t.buildDnsViewIP4(null, false, this) || [])){
							map[a] = true;
						}
					}
					return Object.keys(map);
				}
				if(this.location){
					return this.location.buildDnsViewIP4(net);
				}
				for(const t of this.endpointsList){
					for(const a of (t.buildDnsViewIP4(net, false, this) || [])){
						map[a] = true;
					}
				}
				return Object.keys(map);
			}
		},
		"source" : {
			// the source 'settings' object, from which this object was constructed
			value : null
		},
		"toSourceObject" : {
			value : function(){
				return this.source;
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc Target("+this.key+")]";
			}
		}
	},{
		"makeTargetObject" : {
			value : function(key, config, source){
				{
					const t1 = source.proxyHttp;
					const t2 = source.proxyHttps;
					const t3 = source.redirectHttp;
					const t4 = source.redirectHttps;
					if(t1 || t2 || t3 || t4){
						return new TargetStatic(
							config, 
							key, 
							source, 
							t1, 
							t2
						);
					}
				}
				{
					const t = source.target;
					if("string" === typeof t){
						return new TargetSingle(config, key, source, t);
					}
					if(t && t.length){
						return t.length == 1
							? new TargetSingle(config, key, source, t[0])
							: new TargetMultiple(config, key, source, t);
						;
					}
				}
				// invalid?
				return new Target(config, key, source);
			}
		}
	}
);





const TargetStatic = f.defineClass(
	"TargetStatic",
	Target,
	function(config, key, source, proxyHttp, proxyHttps, redirectHttp, redirectHttps){
		this.Target(config, key, source);
		Object.defineProperties(this, {
			"proxyHttp" : {
				value : proxyHttp
			},
			"proxyHttps" : {
				value : proxyHttps
			},
			"redirectHttp" : {
				value : redirectHttp
			},
			"redirectHttps" : {
				value : redirectHttps
			},
		});
		return this;
	},{
		"proxyHttp" : {
			value : null
		},
		"proxyHttps" : {
			value : null
		},
		"redirectHttp" : {
			value : null
		},
		"redirectHttps" : {
			value : null
		},
		"modeDns" : {
			// null, 'use-wan', 'use-router', 'direct', 'local', 'remote', 'static'
			value : null
		},
		"endpointsToMap" : {
			value : function(mapInitial){
				const map = mapInitial || {};
				map[this.key] = this;
				return map;
			}
		},
		"endpointsList" : {
			get : function(){
				return [ this ];
			}
		},
		"upstreamList" : {
			// to be functionnally compatible with Target objects
			get : function(){
				return [ new UpstreamObject() ];
			}
		},
		"buildDirectIP4" : {
			value : function(net){
				const map = {};
				for(const t of [ this ]){
					const lan3 = null !== net && t.lan3 && net.filterIp(t.lan3);
					(lan3 && (map[lan3] = true)) ||
						(t.wan3 && (map[t.wan3] = true))
					;
				}
				const keys = Object.keys(map);
				return keys.length ? keys : undefined;
			}
		},
		"buildDnsViewIP4" : {
			value : function(net, own, parent/*, location*/){
				const modeDns = parent && parent.modeDns || this.modeDns;
				if(own){
					return undefined;
				}
				if(modeDns === "direct"){
					return undefined;
				}
				if(modeDns === "use-router"){
					if(this.location){
						return this.location.buildDnsViewIP4(net);
					}
					return this.config.buildDnsViewIP4(net);
				}
				if(!modeDns && !this.location){
					return this.config.buildDnsViewIP4(net);
				}
				const location = this.location || this.config.location;
				if(modeDns === "use-wan"){
					if(location){
						return location.buildDnsViewIP4(null);
					}
					return this.config.buildDnsViewIP4(null);
				}
				if(location){
					return location.buildDnsViewIP4(net);
				}
				return this.config.buildDnsViewIP4(net);
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc TargetStatic("+this.key+")]";
			}
		}
	}
);






const TargetMultiple = f.defineClass(
	"TargetMultiple",
	Target,
	function(config, key, source, target){
		this.Target(config, key, source);
		Object.defineProperties(this, {
			"target" : {
				value : target
			},
		});
		return this;
	},{
		"target" : {
			// array
			value : null
		},
		"immediateEndpoints" : {
			value : null
		},
		"endpointsToMap" : {
			value : function(mapInitial){
				const map = mapInitial || {};
				for(let key of [].concat(this.target)){
					if(key !== this.key){
						const target = this.config.targets.map[key];
						if(target && target !== this){
							target.endpointsToMap(map);
							continue;
						}
					}
					{
						const server = this.config.servers.map[key];
						if(server){
							map[key] = server;
							continue;
						}
					}
				}
				return map;
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc TargetMultiple("+this.key+")]";
			}
		}
	}
);








const TargetSingle = f.defineClass(
	"TargetSingle",
	TargetMultiple,
	function(config, key, source, target){
		// not TargetMultiple - using different properties
		this.Target(config, key, source);
		Object.defineProperties(this, {
			"target" : {
				value : target
			},
		});
		return this;
	},{
		"target" : {
			// single target key
			value : null
		},
		"toString" : {
			value : function(){
				return "[yamnrc TargetSingle("+this.key+")]";
			}
		}
	}
);









const UpstreamObject = f.defineClass(
	"UpstreamObject",
	undefined,
	function(){
		return this;
	},{

	}
);


	








const Locations = f.defineClass(
	"Locations",
	ListAndMap,
	function(config, source){
		this.ListAndMap(this);
		Object.defineProperties(this, {
			"config" : {
				value : config
			},
			"source" : {
				value : source || {}
			},
		});
		return this;
	},{
		"key" : {
			// key of given instance 
			value : null
		},
		"source" : {
			// the source 'settings' object, from which this object was constructed
			value : null
		},
		"initializeParse" : {
			value : function(){
				for(let key in this.source){
					const settings = this.source[key];
					const location = new Location(this.config, key, settings);
					this.put(key, location);
				}
			}
		},
		"toSourceObject" : {
			value : function(){
				return this.list.reduce(function(r, x){
					r[x.key] = x.toSourceObject();
					return r;
				}, {});
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc Locations(" + this.list.length + ", [" + Object.keys(this.idx) + "])]";
			}
		}
	}
);






const Servers = f.defineClass(
	"Servers",
	ListAndMap,
	function(config, source){
		this.ListAndMap(this);
		Object.defineProperties(this, {
			"config" : {
				value : config
			},
			"source" : {
				value : source || {}
			},
		});
		return this;
	},{
		"key" : {
			// key of given instance 
			value : null
		},
		"source" : {
			// the source 'settings' object, from which this object was constructed
			value : null
		},
		"initializeParse" : {
			value : function(){
				for(let key in this.source){
					const settings = this.source[key];
					const server = settings.router 
						? new Router(this.config, key, settings)
						: new Server(this.config, key, settings)
					;
					this.put(key, server);
					const location = this.config.locations.map[server.source.location];
					if(location){
						location.servers.put(key, server);
					}
				}
			}
		},
		"toSourceObject" : {
			value : function(){
				return this.list.reduce(function(r, x){
					r[x.key] = x.toSourceObject();
					return r;
				}, {});
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc Servers(" + this.list.length + ", " + Object.keys(this.idx) + ")]";
			}
		}
	}
);










const Routers = f.defineClass(
	"Routers",
	Servers,
	function(config, source){
		this.Servers(config, source);
		return this;
	}, {
		"key" : {
			// key of given instance 
			value : null
		},
		"source" : {
			// the source 'settings' object, from which this object was constructed
			value : null
		},
		"initializeParse" : {
			value : function(){
				const servers = this.config.servers.map;
				for(let key in servers){
					const server = servers[key];
					if(server.Router){
						this.put(key, server);
						const location = this.config.locations.map[server.source.location];
						if(location){
							location.routers.put(key, server);
						}
					}
				}
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc Routers(" + this.list.length + ", " + Object.keys(this.idx) + ")]";
			}
		}
	},{
		"FILTER_ACTIVE" : {
			value : function(x){
				return x && x.router === 'active';
			}
		}
	}
);







const Targets = f.defineClass(
	"Targets",
	ListAndMap,
	function(config, source){
		this.ListAndMap(this);
		Object.defineProperties(this, {
			"config" : {
				value : config
			},
			"source" : {
				value : source || {}
			},
		});
		return this;
	},{
		"key" : {
			// key of given instance 
			value : null
		},
		"source" : {
			// the source 'settings' object, from which this object was constructed
			value : null
		},
		"initializeParse" : {
			value : function(){
				for(let key in this.source){
					const settings = this.source[key];
					const target = Target.makeTargetObject(key, this.config, settings);
					if(target){
						this.put(key, target);
					}
				}
			}
		},
		"toSourceObject" : {
			value : function(){
				return this.list.reduce(function(r, x){
					r[x.key] = x.toSourceObject();
					return r;
				}, {});
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc Targets(" + this.list.length + ", " + Object.keys(this.idx) + ")]";
			}
		}
	}
);













const Routing = f.defineClass(
	"Routing",
	undefined,
	function(config, source){
		Object.defineProperties(this, {
			"config" : {
				value : config
			},
			"source" : {
				value : source || {}
			},
			"domains" : {
				value : new Domains(config, (source || {}).domains)
			}
		});
		return this;
	}, {
		"domains" : {
			value : undefined
		},
		"initializeParse" : {
			value : function(){
				this.domains.initializeParse();
			}
		},
		"toSourceObject" : {
			value : function(){
				return {
					domains : this.domains && this.domains.toSourceObject() || undefined
				};
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc Routing()]";
			}
		}
	}
);




const Domains = f.defineClass(
	"Domains",
	ListAndMap,
	function(config, source){
		this.ListAndMap(this);
		Object.defineProperties(this, {
			"config" : {
				value : config
			},
			"source" : {
				value : source || {}
			}
		});
		return this;
	},{
		"initializeParse" : {
			value : function(){
				for(let key in this.source){
					const settings = this.source[key];
					const domain = Domain.makeDomain(key, this.config, settings);
					domain && this.put(key, domain);
				}
			}
		},
		"toSourceObject" : {
			value : function(){
				return this.list.reduce(function(r, x){
					r[x.key] = x.toSourceObject();
					return r;
				}, {});
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc Domains()]";
			}
		}
	},{

	}
);


const Domain = f.defineClass(
	"Domain",
	undefined,
	/* (".myx.ru"...) */
	function(key, config, source){
		Object.defineProperties(this, {
			"key" : {
				value : key
			},
			"config" : {
				value : config
			},
			"source" : {
				value : source || {}
			},
		});
		return this;
	},{
		"key" : {
			value : undefined
		},
		"publish" : {
			value : undefined
		},
		"mode" : {
			value : undefined
		},
		"filterName" : {
			value : function(x){
				if(x.endsWith(this.key)){
					return x + '.';
				}
				return undefined;
			}
		},
		"toSourceObject" : {
			value : function(){
				return {
					"publish" : this.publish,
					"mode" : this.mode,
					"toString" : this.toString()
				};
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc Domain("+this.key+")]";
			}
		}
	},{
		"makeDomain" : {
			value : function(key, config, source){
				if(!source){
					throw new Error("No source for domain: " + key);
				}
				switch(source.mode || 'static'){
					case 'static':
						return new DomainStatic(key, config, source);
					case 'infrastructure':
						return new DomainInfrastructure(key, config, source);
					case 'slave':
						return new DomainSlave(key, config, source);
					case 'dedicated':
						return new DomainDedicated(key, config, source);
					case 'delegated':
						return new DomainDelegated(key, config, source);
				}
				throw new Error("Invalid domain ("+key+") mode: " + source.mode);
			}
		}
	}
);


const DomainStatic = f.defineClass(
	"DomainStatic",
	Domain,
	function(key, config, source){
		this.Domain(key, config, source);
		Object.defineProperties(this, {
			"dns" : {
				value : new DnsStatic(config, source && source.dns)
			}
		});
		return this;
	}, {
		"mode" : {
			value : "static"
		},
		"allowTransfer" : {
			value : "none"
		},
		"dns" : {
			value : undefined
		},
		"toSourceObject" : {
			value : function(){
				return {
					"publish" : this.publish,
					"mode" : this.mode,
					"dns" : this.dns.toSourceObject()
				};
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc DomainStatic("+this.key+")]";
			}
		}
	}, {
		
	}
);




const DomainInfrastructure = f.defineClass(
	"DomainInfrastructure",
	DomainStatic,
	function(key, config, source){
		this.DomainStatic(key, config, source);
		return this;
	}, {
		"mode" : {
			value : "infrastructure"
		},
		"filterName" : {
			value : function(x){
				if(x.endsWith(this.key)){
					return x + '.';
				}
				for(let d of this.config.routing.domains.list){
					if(x.endsWith(d.key)){
						return d.DomainInfrastructure
							? x.substr(0, x.length-d.key.length) + this.key + '.'
							: undefined;
					}
				}
				return x + this.key + '.';
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc DomainInfrastructure("+this.key+")]";
			}
		}
	}, {
		
	}
);


const DomainDedicated = f.defineClass(
	"DomainDedicated",
	DomainStatic,
	function(key, config, source){
		this.DomainStatic(key, config, source);
		return this;
	}, {
		"mode" : {
			value : "dedicated"
		},
		"toString" : {
			value : function(){
				return "[yamnrc DomainDedicated("+this.key+")]";
			}
		}
	}, {
		
	}
);


const DomainDeletaged = f.defineClass(
	"DomainDelegated",
	Domain,
	function(key, config, source){
		this.Domain(key, config, source);
		Object.defineProperties(this, {
			"servers" : {
				value : source && source.servers && [].concat(source.servers) || []
			}
		});
		return this;
	}, {
		"mode" : {
			value : "delegated"
		},
		"toSourceObject" : {
			value : function(){
				return {
					"publish" : this.publish,
					"mode" : this.mode,
					"servers" : this.servers
				};
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc DomainDelegated("+this.key+")]";
			}
		}
	}, {
		
	}
);

const DomainSlave = f.defineClass(
	"DomainSlave",
	Domain,
	function(key, config, source){
		this.Domain(key, config, source);
		Object.defineProperties(this, {
			"masters" : {
				value : source && source.masters && [].concat(source.masters) || []
			}
		});
		return this;
	}, {
		"mode" : {
			value : "slave"
		},
		"toSourceObject" : {
			value : function(){
				return {
					"publish" : this.publish,
					"mode" : this.mode,
					"masters" : this.masters
				};
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc DomainSlave("+this.key+")]";
			}
		}
	}, {
		
	}
);


const DnsStatic = f.defineClass(
	"DnsStatic",
	ListAndMap,
	function(config, source){
		this.ListAndMap(this);
		Object.defineProperties(this, {
			"config" : {
				value : config
			},
			"source" : {
				value : source || {}
			},
			"types" : {
				value : []
			}
		});
		if(source){
			for(let key in source){
				this.put(key, new DnsTypeStatic(key, config, source[key]));
			}
		}
		return this;
	},{
		"toSourceObject" : {
			value : function(){
				return this.isEmpty()
					? undefined
					: this.list.reduce(function(r, x){
						r[x.key] = x.toSourceObject();
						return r;
					}, {})
				;
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc DnsStatic()]";
			}
		}
	}
);

const DnsTypeStatic = f.defineClass(
	"DnsTypeStatic",
	ListAndMap,
	function(key, config, source){
		this.ListAndMap(this);
		Object.defineProperties(this, {
			"key" : {
				value : key
			},
			"config" : {
				value : config
			},
			"source" : {
				value : source || {}
			}
		});
		if(source){
			for(let key in source){
				this.put(key, new DnsRecordStatic(key, source[key]));
			}
		}
		return this;
	}, {
		"toSourceObject" : {
			value : function(){
				return this.list.reduce(function(r, x){
					r[x.key] = x.toSourceObject();
					return r;
				}, {});
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc DnsTypeStatic()]";
			}
		}
	}
);



const DnsRecordStatic = f.defineClass(
	"DnsRecordStatic",
	undefined,
	function(key, value){
		Object.defineProperties(this, {
			"key" : {
				value : key
			},
			"value" : {
				value : value
			}
		});
		return this;
	},{
		"key" : {
			value : undefined
		},
		"value" : {
			value : undefined
		},
		"toSourceObject" : {
			value : function(){
				return [].concat(this.value);
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc DnsRecordStatic("+this.key+")]";
			}
		}
	}
);





const Configuration = f.defineClass(
	"Configuration",
	undefined,
	function(source){
		Object.defineProperties(this, {
			"locations" : {
				value : new Locations(this, source.locations)
			},
			"servers" : {
				value : new Servers(this, source.servers)
			},
			"routers" : {
				value : new Routers(this, source.servers)
			},
			"targets" : {
				value : new Targets(this, source.targets || source.routing && source.routing.routes)
			},
			"routing" : {
				value : new Routing(this, source.routing)
			},
			"source" : {
				value : source
			},
		});
		
		this.locations.initializeParse();
		this.servers.initializeParse();
		this.targets.initializeParse();
		this.routers.initializeParse();
		this.routing.initializeParse();
		
		return this;
	}, {
		"wan6" : {
		
		},
		"wan3" : {
		
		},
		"locations" : {
			// ListAndMap instance 
			value : null
		},
		"location" : {
			// current Location instance 
			value : null
		},
		"servers" : {
			// ListAndMap instance 
			value : null
		},
		"server" : {
			// current Server instance 
			value : null
		},
		"routers" : {
			// ListAndMap instance 
			value : null
		},
		"routing" : {
			// Routing configuration class instance
			value : null
		},
		"router" : {
			// current Router instance 
			value : null
		},
		"targets" : {
			// ListAndMap instance 
			value : null
		},
		"wan3smart" : {
			// Array of external IPs for Layer3 access (length is likely 1 or 0, but could have several WAN IPs of all the routers) 
			get : function(){
				return this.buildDnsViewIP4(null);
			}
		},
		"lan3smart" : {
			// Array of local IPs for Layer3 access (length is likely 1 or 0, but could have several LAN IPs of all the routers) 
			get : function(){
				return this.buildDnsViewIP4(this.location && this.location.lans || null);
			}
		},
		"buildDnsViewIP4" : {
			value : function(net){
				const result = {};
				for(var l of this.locations.list){
					if(l.wan3 && l.routers.list.some(function(x){ return x.router === 'active'; })){
						result[l.wan3] = true;
						continue;
					}
					for(var i of l.routers.list){
						if(i.router === 'active' && i.wan3){
							result[i.wan3] = true;
						}
					}
				}
				{
					const keys = Object.keys(result);
					if(keys.length) {
						return keys;
					}
				}
				for(var l of this.locations.list){
					for(var i of this.routers.list){
						if(i.router === 'testing' && i.wan3){
							result[i.wan3] = true;
						}
					}
				}
				return Object.keys(result);
			}
		},
		"view" : {
			// current View instance (null, location, server or router)
			value : null
		},
		"source" : {
			// the source 'settings' object, from which this object was constructed
			value : null
		},
		"targetListDns" : {
			// all servers and targets related to DNS
			get : function(){
				const map = {};
				for(const t of this.servers.list){
					map[t.key] = t;
				}
				for(const t of this.targets.list){
					map[t.key] = t;
				}
				return Object.values(map);
			}
		},
		"targetListWeb" : {
			// all servers and targets related to DNS
			get : function(){
				const map = {};
				for(const target of this.targets.list){
					map[target.key] = target;
				}
				if(!map['default']){
					map['default'] = new Target(this, 'default', {});
				}
				return Object.values(map);
			}
		},
		"dnsViewLocal" : {
			get : function(){
				return this.buildDnsView(Networks.LOCAL);
			}
		},
		"dnsViewGlobal" : {
			get : function(){
				return this.buildDnsView(null /*NetworkAddress.GLOBAL*/);
			}
		},
		"buildDnsZoneView" : {
			value : function(net, domain){
				if(!domain.DomainStatic){
					return domain;
				}
				const result = new DomainStatic(domain.key, this, domain.source);
				var arecds = result.dns.map['A'];
				if(!arecds) {
					arecds = new DnsTypeStatic("A", this, []);
					result.dns.put('A', arecds);
				}
				for(let i of this.targetListDns){
					if(arecds.map[i.key]){
						continue;
					}
					const name = domain.filterName(i.key);
					if(name){
						const a = i.buildDnsViewIP4(net);
						if(a){
							arecds.put(name, new DnsRecordStatic(name, a));
						}
					}
				}
				return result;
			}
		},
		"buildDnsView" : {
			value : function(net){
				const result = new Domains(this);
				for(let domain of this.routing.domains.list){
					const view = this.buildDnsZoneView(net, domain);
					view && (result.put(domain.key, view));
				}
				return result;
			}
		},
		"makeViewForLocation" : {
			value : function(location){
				if(!location){
					return undefined;
				}
				{
					const result = new Configuration(this.source);
					const replacement = result.locations.map[location.key];
					Object.defineProperties(result, {
						"location" : {
							value : replacement
						},
						"view" : {
							value : replacement
						}
					});
					return result;
				}
			}
		},
		"makeViewForServer" : {
			value : function(server){
				if(!server){
					return undefined;
				}
				{
					const result = new Configuration(this.source);
					const replacement = result.servers.map[server.key];
					const location = result.locations.map[server.source.location];
					Object.defineProperties(result, {
						"location" : {
							value : location || null
						},
						"server" : {
							value : replacement
						},
						"router" : {
							value : replacement.Router && replacement
						},
						"view" : {
							value : replacement
						}
					});
					return result;
				}
			}
		},
		"makeView" : {
			value : function(x){
				if(!x){
					return undefined;
				}
				if('string' === typeof x){
					{
						const server = this.servers.map[x];
						if(server){
							return this.makeViewForServer(server);
						}
					}
					{
						const location = this.locations.map[x]
						if(location){
							return this.makeViewForLocation(location);
						}
					}
					return undefined;
				}
				if(x.Server){
					return this.makeViewForServer(x);
				}
				if(x.Location){
					return this.makeViewForLocation(x);
				}
				return undefined;
			}
		},
		"makeNonSecure" : {
			value : function(){
				return ;
			}
		},
		"toSource" : {
			value : function(){
				return JSON.stringify(this.toSourceObject(), null, 4);
			}
		},
		"toSourceObject" : {
			value : function(){
				return {
					locations	: this.locations.toSourceObject(),
					servers		: this.servers.toSourceObject(),
					routing		: this.routing.toSourceObject(),
					targets		: this.targets.toSourceObject(),
				};
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc Configuration("+(this.view || '')+")]";
			}
		}
	}
);


module.exports = {
	"SingleAddress" : SingleAddress,
	"NetworkAddress" : NetworkAddress,
	"Networks" : Networks,
	"Location" : Location,
	"Locations" : Locations,
	"Server" : Server,
	"Servers" : Servers,
	"Router" : Router,
	"Routers" : Routers,
	"Target" : Target,
	"TargetStatic" : TargetStatic,
	"Targets" : Targets,
	"Routing" : Routing,
	"Domains" : Domains,
	"Domain" : Domain,
	

	// returns Configuration	
    "parse" : function (config) {
		return config
			? new Configuration(config)
			: undefined;
    }
};
