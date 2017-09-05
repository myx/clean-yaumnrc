/**
 * 
 *	const config = Config.parse({
 *		"locations" : {
 *			"h1" : {
 *				"name" : "h1.myx.ru",
 *				"wan3" : "h1-wan",
 *				"lan3" : "192.168.1.250",
 *				"tap3" : "10.112.11.20"
 *			},.......
 *  
 * 	});
 *  
 * 
 * 	const view = config.makeView('l6h1.myx.ru');
 * 
 * 
 *  .resolveXXX - Name Resolution (DNS) related
 *  .provisionXXX - Envirionvemt Provisioning (DHCP) related
 *  .proxyXXX - Level6 Proxying (NGINX/SOCKS) related
 *  .forwardXXX - Level3 Forwarding (IPFW/NAT) related
 *  .networkXXX - L2, L3/CIDR segment (like 192.168.3.0/24;192.168.7.0/24)
 * 
 * 
 *  .locations
 *  .servers
 *  .targets
 *  .routing
 *  .routing.domains
 */

const Class = {
	"create" : function(name, inherit, constructor, properties, statics){
		const prototype = constructor.prototype = inherit
			? Object.create(inherit.prototype || inherit)
			: {};
		if(properties){
			for(const key in properties){
				let desc = properties[key];
				if('function' === typeof desc.get && desc.execute === 'once'){
					const get = desc.get;
					desc = Object.create(desc);
					desc.get = function(){
						const result = get.call(this);
						this === prototype || Object.defineProperty(this, key, { value : result });
						return result;
					};
				}
				Object.defineProperty(prototype, key, desc);
			}
			// Object.defineProperties(prototype, properties);
		}
		if(name && !(properties && properties[name])){
			f.defineProperty(prototype, name, constructor);
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
	}
};


const f = {
	defineProperty : function(o, n, v){
		Object.defineProperty(o, n, { value : v	});
		return v;
	},
	parseNetwork : function(cidr, mac, defaultBits, key){
		if(!cidr){
			return undefined;
		}
		if(cidr.AbstractAddress){
			return cidr;
		}
		if(cidr.ip || cidr.key || cidr.mac){
			return f.parseNetwork(cidr.ip, cidr.mac, defaultBits, key || cidr.key);
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
				mac,
				key
			);
		}
		{
			const bits = parseInt(cidr.substr(pos+1));
			return new NetworkAddress(
				cidr, 
				cidr.substr(0, pos), 
				bits, 
				mac,
				key
			);
		}
	}
};

const AbstractAddress = Class.create(
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

const SingleAddress = Class.create(
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
		"key" : {
			get : function(){
				return this.AbstractAddress.intForIPv4(ip);
			}
		},
		"networkCidr" : {
			get : function(){
				return this.ip + '/32';
			}
		},
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


const NetworkAddress = Class.create(
	"NetworkAddress",
	AbstractAddress,
	function(cidr, ip, bits, mac, key){
		const mask = (0xFFFFFFFF * Math.pow(2, 32 - bits)) % 0x100000000;
		const network = AbstractAddress.intForIPv4(ip) & mask;
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
		if(key){
			f.defineProperty(this, 'key', key);
		}
		return this;
	}, {
		"key" : {
			get : function(){
				return 'net-' + this.network.replace(/\./g,'-')+'-'+this.bits;
			}
		},
		"network" : {
			get : function(){
				return this.network = AbstractAddress.intToIPv4(this.networkInt);
			}
		},
		"networkCidr" : {
			get : function(){
				return this.network + '/' + this.bits;
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
				return this.containsIp(ip) ? this : undefined;
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


const Networks = Class.create(
	"Networks",
	AbstractAddress,
	function(cidrArray, key){
		Object.defineProperties(this, {
			"cidrs" : {
				value : cidrArray ? [].concat(cidrArray) : []
			},
		});
		if(key){
			f.defineProperty(this, 'key', key);
		}
		return this;
	}, {
		"key" : {
			get : function(){
				return 'nets-'+this.list.map(function(x){return x.key;}).join('-');
			}
		},
		"addNetwork" : {
			value : function(net){
				this.cidrs.push(net);
				delete this.list;
				return this;
			}
		},
		"networkCidr" : {
			get : function(){
				return this.list.map(function(x){return x.networkCidr;}).join(';');
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
			get : function(){
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



const ListAndMap = Class.create(
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
		"sort" : {
			value : function(compare){
				this.list.sort(compare);
				this.list.forEach(function(value, idx) {
					for(const key in this.map){
						if(this.map[key] === value){
							this.idx[key] = idx;
							return;
						}
					}
					throw new Error("Can't find key for idx: " + idx + ", value: " + value);
				}, this);
				return this;
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc ListAndMap(" + this.list.length + ", [" + Object.keys(this.idx) + "])]";
			}
		}
	}
);




const SourceObject = Class.create(
	"SourceObject",
	undefined,
	function(source){
		(undefined !== source) && f.defineProperty(this, 'source', source);
		return this;
	},{
		"source" : {
			// the source 'settings' object, from which this object was constructed
			value : null
		},
		"toSourceNonSecure" : {
			value : function(){
				return JSON.stringify(this.toSourceObjectNonSecure(), null, 4);
			}
		},
		"toSource" : {
			value : function(){
				return JSON.stringify(this.toSourceObject(), null, 4);
			}
		},
		"toSourceObjectNonSecure" : {
			value : function(){
				const o = this.toSourceObject();
				return SourceObject.filterSecrets(o);
			}
		},
		"toSourceObject" : {
			value : function(){
				return undefined;
			}
		}
	},{
		"hashCode" : {
			value : function() {
				const len = this.length;
				var ret = 0, i = 0;
				for(; i < len; ++i) {
					ret = (31 * ret + this.charCodeAt(i)) << 0;
				}
				return ret;
			}
		},
		"filterSecrets" : {
			value : function(x){
				switch(typeof x){
					case 'string':{
						if(x.includes("RSA PRIVATE KEY")){
							return "--- RSA PRIVATE KEY, hash: " + SourceObject.hashCode.call(x);
						}
						if(x.includes("RSA PUBLIC KEY")){
							return "--- RSA PUBLIC KEY, hash: " + SourceObject.hashCode.call(x);
						}
						if(x.includes("BEGIN PRIVATE KEY")){
							return "--- SSL PRIVATE KEY, hash: " + SourceObject.hashCode.call(x);
						}
						
					}
					case 'undefined':
					case 'null':
					case 'number':
					case 'boolean':
						return x;
					default:{
						if(x === null){
							return null;
						}
						if(Array.isArray(x)){
							var r = [], d = false, k, l = x.length, v, f;
							for(k = 0; k < l; ++k){
								v = x[k];
								f = SourceObject.filterSecrets(v);
								f !== v && (d = true);
								f !== undefined && (r[k] = f);
							}
							return d ? r : x;
						}
						{
							var r = {}, d = false, k, l = x.length, v, f;
							for(k in x){
								v = x[k];
								f = SourceObject.filterSecrets(v);
								f !== v && (d = true);
								f !== undefined && (r[k] = f);
							}
							return d ? r : x;
						}
					}
				}
			}
		}
	}
);




const ConfigObject = Class.create(
	"ConfigObject",
	SourceObject,
	function(config, source){
		this.SourceObject(source);
		(undefined !== config) && f.defineProperty(this, "config", config);
		return this;
	},{
		"config" : {
			// parent configuration instance
			value : null
		},
		"toString" : {
			value : function(){
				return "[yamnrc ConfigObject(" + this.config + "])]";
			}
		}
	}
);



const ResolvableObject = Class.create(
	"ResolvableObject",
	ConfigObject,
	function(config, source){
		this.ConfigObject(config, source);
		source && source.dns && Object.defineProperties(this, {
			"resolveMode" : {
				value : source.dns
			},
		});
		return this;
	},{
		"resolveMode" : {
			// null, 'use-wan', 'use-router', 'direct', 'local', 'remote', 'static'
			value : undefined
		},
		"modeDns" : {
			// OBSOLETE
			get : function(){
				return this.resolveMode;
			}
		},
		"findLanForClient" : {
			// OBSOLETE
			get : function(){
				return this.networkForClient;
			}
		},
		"wan3smart" : {
			// Array of external IPs for Layer3 access (length is likely 1 or 0, but could have several WAN IPs of all the routers) 
			execute : "once", get : function(){
				return this.resolveSmartIP4(null);
			}
		},
		"lan3smart" : {
			// Array of local IPs for Layer3 access (length is likely 1 or 0, but could have several LAN IPs of all the routers) 
			execute : "once", get : function(){
				return this.resolveSmartIP4(this.config.location && this.config.location.lans || null);
			}
		},
		"resolveDirectIP4" : {
			value : function(net){
				throw new Error("Must re-implement, instance: " + this + ", net: " + net);
			}
		},
		"resolveSmartIP4" : {
			value : function(net, own, parent/*, location*/){
				return this.resolveDirectIP4(net);
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc ResolvableObject(" + this.key + "])]";
			}
		}		
	}
);





const Location = Class.create(
	"Location",
	ResolvableObject,
	function(config, key, source){
		this.ResolvableObject(config, source);

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
					f.defineProperty(lan, 'location', self);
					if(!r) return lan;
					if(r.Networks){
						r.addNetwork(lan);
					}else{
						r = new Networks().addNetwork(r).addNetwork(lan);
						f.defineProperty(r, 'location', self);
					}
				}
			}
			return r;
		}, undefined);

		Object.defineProperties(this, {
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
			"servers" : {
				value : new ListAndMap()
			},
			"routers" : {
				value : new ListAndMap()
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
			execute : "once", get : function(){
				if(this.lans){
					if(this.lans.list){
						return this.lans.list.reduce(function(r, x){ 
							x.ip && r.push(x.ip);
							return r; 
						}, []);
					}
					if(this.lans.ip){
						return [ this.lans.ip ];
					}
				}
				return undefined;
			}
		},
		"tap3" : {
			// Array of local IPs for Layer3 access (tap to inter-cluster vpn) 
			value : null
		},
		"resolveDirectIP4" : {
			value : function(net){
				if(net && this.lan3 && net.location === this){
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
				return undefined;
			}
		},
		"resolveSmartIP4" : {
			value : function(net, own/*, location*/){

				{
					const result = this.resolveDirectIP4(net);
					if(result) return result;
				}
				{
					const result = {};
					{
						for(var i of this.routers.list){
							if(i.router === 'active'){
								for(const i of (i.resolveSmartIP4(net, true) || [])){
									result[i] = true;
								}
							}
						}
						const keys = Object.keys(result);
						if(keys.length) return keys;
					}
					{
						for(var i of this.routers.list){
							if(i.router === 'testing'){
								for(const i of (i.resolveSmartIP4(net, true) || [])){
									result[i] = true;
								}
							}
						}
						const keys = Object.keys(result);
						return keys.length ? keys : undefined;
					}
				}
			}
		},
		"resolveForHost" : {
			value : function(t, net){
				return this.config.resolveForHost(t, net || this.lans || null);
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
			execute : "once", get : function(){
				return this.source && this.source.name || this.key;
			}
		},
		"title" : {
			// title, name or key of given instance 
			execute : "once", get : function(){
				return this.source && this.source.title || this.name;
			}
		},
		"servers" : {
			// ListAndMap instance 
			value : null
		},
		"routers" : {
			// ListAndMap instance 
			value : null
		},
		"networkForClient" : {
			value : function(ip){
				return this.lans.networkForIp(ip);
			}
		},
		"findGatewayForClient" : {
			value : function(ip){
				const lan = this.lans.networkForIp(ip);
				return lan && lan.ip || undefined;
			}
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






const Server = Class.create(
	"Server",
	ResolvableObject,
	function(config, key, source){
		this.ResolvableObject(config, source);
		f.defineProperty(this, "key", key);
		return this;
	}, {
		"key" : {
			// key of given instance 
			value : null
		},
		"wan3" : {
			// null or Array of external IPs for Layer3 access 
			execute : "once", get : function(){
				return this.source.wan && this.source.wan.ip;
			}
		},
		"lan3" : {
			// null or Array of local network IPs for Layer3 access 
			execute : "once", get : function(){
				return this.source.lan && this.source.lan.ip;
			}
		},
		"location" : {
			execute : "once", get : function(){
				return this.config.locations.map[this.source.location];
			}
		},
		"selected" : {
			get : function(){
				return this === this.config.server;
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
			execute : "once", get : function(){
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
		"resolveDirectIP4" : {
			value : function(net){
				if(net){
					if(this.location === net.location){
						const a = this.lan3 && net.filterIp(this.lan3, true) || this.wan3;
						return a ? [ a ] : undefined;
					}
				}
				{
					const a = this.wan3;
					return a ? [ a ] : undefined;
				}
			}
		},
		"resolveSmartIP4" : {
			value : function(net, own, parent/*, location*/){
				const resolveMode = parent && (parent.resolveMode || 'default') || this.resolveMode || 'direct';
				if(resolveMode === "use-wan"){
					const a = this.resolveDirectIP4(null);
					if(a){
						return a;
					}
				}
				if(resolveMode === "direct"){
					const a = this.resolveDirectIP4(net);
					if(a){
						return a;
					}
				}
				if(own){
					return undefined;
				}
				if(this.location){
					return this.location.resolveSmartIP4(net);
				}
				return this.config.resolveSmartIP4(net);
			}
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






const Router = Class.create(
	"Router",
	Server,
	function(config, key, source){
		this.Server(config, key, source);
		f.defineProperty(this, "router", source.router);
		return this;
	}, {
		"router" : {
			// the 'router' mode attribute ('active', 'testing', 'enabled', ...)
			value : null
		},
		"tap3" : {
			// null or Array of tinc-tap network IPs for Layer3 access 
			execute : "once", get : function(){
				return this.source.tap && this.source.tap.ip;
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc Router(" + this.key + ")]";
			}
		}
	}
);










const Target = Class.create(
	"Target",
	ResolvableObject,
	function(config, key, source){
		this.ResolvableObject(config, source);
		f.defineProperty(this, "key", key);
		return this;
	}, {
		"key" : {
			// key of given instance 
			value : null
		},
		"location" : {
			execute : "once", get : function(){
				return this.source.location && this.config.locations.map[this.source.location];
			}
		},
		"endpointsToMap" : {
			value : function(mapInitial){
				// abstract
				return mapInitial || {};
			}
		},
		"endpointsMap" : {
			execute : "once", get : function(){
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
			execute : "once", get : function(){
				for(const target of this.endpointsList){
					if(!target.location || target.location === this.config.location){
						return true;
					}
				}
				return false;
			}
		},
		"resolveDirectIP4" : {
			value : function(net, forceDirect){
				const map = {};
				if(net){
					for(const t of this.endpointsList){
						if(t.location === net.location){
							const lan3 = forceDirect 
								? t.lan3
								: t.lan3 && net.filterIp(t.lan3, true);
							(lan3 && (map[lan3] = true));
						}
					}
					const keys = Object.keys(map);
					if(keys.length) return keys;
				}
				if(forceDirect){
					const location = (net && net.location) || (this.config.location);
					if(location){
						for(const t of this.endpointsList){
							if(t.location === location){
								(t.wan3 && (map[t.wan3] = true));
							}
						}
						const keys = Object.keys(map);
						if(keys.length) return keys;
					}
				}
				{
					for(const t of this.endpointsList){
						(t.wan3 && (map[t.wan3] = true));
					}
					const keys = Object.keys(map);
					return keys.length ? keys : undefined;
				}
			}
		},
		"resolveSmartIP4" : {
			value : function(net, own, parent/*, location*/){
				const resolveMode = parent && parent.resolveMode || this.resolveMode;
				if(resolveMode === "use-router"){
					if(this.location){
						return this.location.resolveSmartIP4(net);
					}
				}
				if(resolveMode === "use-local"){
					if(net && net.location){
						return net.location.resolveSmartIP4(net);
					}
				}
				if(resolveMode === "direct"){
					const result = this.resolveDirectIP4(net, true);
					if(result) return result;
				}
				const map = {};
				if(resolveMode === "use-wan"){
					const result = this.resolveDirectIP4(null);
					if(result) return result;
					if(this.location){
						return this.location.resolveSmartIP4(null);
					}
					for(const t of this.endpointsList){
						for(const a of (t.resolveSmartIP4(null, false, this) || [])){
							map[a] = true;
						}
					}
					return Object.keys(map);
				}
				if(this.location){
					return this.location.resolveSmartIP4(net);
				}
				for(const t of this.endpointsList){
					for(const a of (t.resolveSmartIP4(net, false, this) || [])){
						map[a] = true;
					}
				}
				{
					const keys = Object.keys(map);
					if(!keys.length) return undefined;
					if(net && net.location){
						if(keys.length > 1){
							const view = net.location.resolveSmartIP4(net);
							if(view) return view;
						}
					}
					return keys;
				}
			}
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





const TargetStatic = Class.create(
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
		"resolveDirectIP4" : {
			// leads to l6routes
			value : function(net){
				if(this.location){
					return this.location.resolveDirectIP4(net);
				}
				if(net){
					if(net.location){
						return net.location.resolveDirectIP4(net);
					}
					if(this.config.location){
						return this.config.location.resolveDirectIP4(net);
					}
				}
				return this.config.resolveDirectIP4(net);
			}
		},
		"resolveSmartIP4" : {
			value : function(net, own, parent/*, location*/){
				const resolveMode = parent && parent.resolveMode || this.resolveMode;
				if(own){
					return undefined;
				}
				if(resolveMode === "direct" || resolveMode === "use-router"){
					return this.resolveDirectIP4(net);
				}
				if(!resolveMode && !this.location){
					return this.config.resolveSmartIP4(net);
				}
				if(resolveMode === "use-wan"){
					return this.resolveDirectIP4(null);
				}
				return this.resolveDirectIP4(net);
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc TargetStatic("+this.key+")]";
			}
		}
	}
);






const TargetMultiple = Class.create(
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








const TargetSingle = Class.create(
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









const UpstreamObject = Class.create(
	"UpstreamObject",
	undefined,
	function(){
		return this;
	},{

	}
);


	






// ConfigObject that is ListAndMap of SourceObjects
const ConfigListAndMap = Class.create(
	"ConfigListAndMap",
	ListAndMap,
	function(config, source){
		this.ListAndMap();
		this.ConfigObject(config, source);
		return this;
	},{
		"config" : {
			// parent configuration instance
			value : null
		},
		"source" : {
			// the source 'settings' object, from which this object was constructed
			value : null
		},
		"SourceObject" : {
			value : SourceObject
		},
		"ConfigObject" : {
			value : ConfigObject
		},
		"toSourceNonSecure" : {
			value : SourceObject.prototype.toSourceNonSecure
		},
		"toSource" : {
			value : SourceObject.prototype.toSource
		},
		"toSourceObjectNonSecure" : {
			value : SourceObject.prototype.toSourceObjectNonSecure
		},
		"toSourceObject" : {
			value : function(){
				return this.list.reduce(function(r, x){
					r[x.key] = x.toSourceObject ? x.toSourceObject() : x;
					return r;
				}, {});
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc ConfigListAndMap(" + this.config + ", " + this.list.length + ", [" + Object.keys(this.idx) + "])]";
			}
		}
	}
);









const Locations = Class.create(
	"Locations",
	ConfigListAndMap,
	function(config, source){
		this.ConfigListAndMap(config, source || {});
		return this;
	},{
		"key" : {
			// key of given instance 
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
		"toString" : {
			value : function(){
				return "[yamnrc Locations(" + this.list.length + ", [" + Object.keys(this.idx) + "])]";
			}
		}
	}
);






const Servers = Class.create(
	"Servers",
	ConfigListAndMap,
	function(config, source){
		this.ConfigListAndMap(config, source || {});
		return this;
	},{
		"key" : {
			// key of given instance 
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
		"toString" : {
			value : function(){
				return "[yamnrc Servers(" + this.list.length + ", " + Object.keys(this.idx) + ")]";
			}
		}
	}
);










const Routers = Class.create(
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







const Targets = Class.create(
	"Targets",
	ConfigListAndMap,
	function(config, source){
		this.ConfigListAndMap(config, source || {});
		return this;
	},{
		"key" : {
			// key of given instance 
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
		"toString" : {
			value : function(){
				return "[yamnrc Targets(" + this.list.length + ", " + Object.keys(this.idx) + ")]";
			}
		}
	}
);













const Routing = Class.create(
	"Routing",
	SourceObject,
	function(config, source){
		this.SourceObject(source || {});
		Object.defineProperties(this, {
			"config" : {
				value : config
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
					"domains" : this.domains && this.domains.toSourceObject() || undefined
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




const Domains = Class.create(
	"Domains",
	ConfigListAndMap,
	function(config, source){
		this.ConfigListAndMap(config, source);
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
		"domainForHost" : {
			value : function(host){
				var l = 0, r = undefined;
				for(const d of this.list){
					if(host.endsWith(d.key) && d.key.length > l){
						l = d.key.length;
						r = d;
					}
				}
				return r;
			}
		},
		"resolveForHost" : {
			value : function(host, net){
				const domain = this.domainForHost(host);
				return domain && domain.resolveForHost
					? domain.resolveForHost(host, net)
					: undefined
				;
			}
		},
		"staticViewWan" : {
			execute : "once", get : function(){
				return this.makeStaticView(null);
			}
		},
		"staticViewLan" : {
			execute : "once", get : function(){
				const l = this.config.location;
				return this.makeStaticView(l && l.lans || null);
			}
		},
		"makeStaticView" : {
			value : function(net){
				const result = new Domains(this.config);
				for(let domain of this.list){
					const view = domain.makeStaticView 
						? domain.makeStaticView(net)
						: domain
					;
					view && (result.put(domain.key, view));
				}
				return result;
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


const Domain = Class.create(
	"Domain",
	ConfigObject,
	/* (".myx.ru"...) */
	function(key, config, source){
		this.ConfigObject(config, source || {});
		Object.defineProperties(this, {
			"key" : {
				value : key
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


const DomainStatic = Class.create(
	"DomainStatic",
	Domain,
	function(key, config, source){
		this.Domain(key, config, source);
		Object.defineProperties(this, {
			"dns" : {
				value : new this.DnsStatic(config, source && source.dns)
			}
		});
		return this;
	}, {
		/**
		 * "dns" property of domain source: 
		 * "dns" : { "A" : { "host" : "0.0.0.0" }} }
		 */
		"DnsStatic" : {
			value : Class.create(
				"DnsStatic",
				ConfigListAndMap,
				function(config, source){
					this.ConfigListAndMap(config, source || {});
					if(source) for(let key in source){
						this.put(key, new DnsTypeStatic(key, config, source[key]));
					}
					return this;
				},{
					"toString" : {
						value : function(){
							return "[yamnrc DnsStatic()]";
						}
					}
				}
			)
		},
		"mode" : {
			value : "static"
		},
		"allowTransfer" : {
			value : "none"
		},
		"dns" : {
			value : undefined
		},
		"dnsTypeA" : {
			execute : "once", get : function(){
				return this.ensureDnsTypeByName("A");
			}
		},
		"dnsTypeNS" : {
			execute : "once", get : function(){
				return this.ensureDnsTypeByName("NS");
			}
		},
		"ensureDnsTypeByName" : {
			// Uppercase letters, like: A, AAAA, NS, MX, TXT
			value : function(typeName){
				var records = this.dns.map[typeName];
				if(!records) {
					records = new DnsTypeStatic(typeName, this.config);
					this.dns.put(typeName, records);
				}
				return records;
			}
		},
		"resolveForHost" : {
			value : function(host, net){
				const records = this.dns.map["A"];
				if(!records) return undefined;
				const record = records.map[host+'.'];
				return record && record.value || undefined;
			}
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




const DomainDedicated = Class.create(
	"DomainDedicated",
	DomainStatic,
	function(key, config, source){
		this.DomainStatic(key, config, source);
		return this;
	}, {
		"mode" : {
			value : "dedicated"
		},
		"staticViewWan" : {
			execute : "once", get : function(){
				return this.makeStaticView(null);
			}
		},
		"staticViewLan" : {
			execute : "once", get : function(){
				const l = this.config.location;
				return this.makeStaticView(l && l.lans || null);
			}
		},
		"makeStaticView" : {
			value : function(net){
				const result = new DomainStatic(this.key, this.config, this.source);

				const nrecds = result.dnsTypeNS;
				if(!nrecds.map["@"]){
					const map = {};
					this.config.locations.list.forEach(function(v){
						const a = v.resolveDirectIP4(net);
						if(a && a.length){
							for(const i of a){
								map[i] = true;
							}
						}else{
							v.routers.list.forEach(function(v){
								if(v.router === 'active' || v.router ==='testing'){
									for(const i of (v.resolveDirectIP4(net) || [])){
										map[i] = true;
									}
								}
							});
						}
					});
					nrecds.put("@", new DnsRecordStatic("@", Object.keys(map), 'config'));
				}

				const arecds = result.dnsTypeA;
				for(let i of this.config.targetListDns){
					if(arecds.map[i.key]){
						continue;
					}
					const name = this.filterName(i.key);
					if(name){
						const a = i.resolveSmartIP4(net);
						a && arecds.put(name, new DnsRecordStatic(name, a, 'target-' + i));
					}
				}
				if(!arecds.map["*"] || !arecds.map["@"]){
					const a = this.config.resolveSmartIP4(net);
					arecds.map["*"] || arecds.put("*", new DnsRecordStatic("*", a, 'config'));
					arecds.map["@"] || arecds.put("@", new DnsRecordStatic("@", a, 'config'));
				}
				arecds.sort(DnsRecordStatic.compare);
				
				return result;
			},
		},
		"toString" : {
			value : function(){
				return "[yamnrc DomainDedicated("+this.key+")]";
			}
		}
	}, {
		
	}
);






const DomainInfrastructure = Class.create(
	"DomainInfrastructure",
	DomainDedicated,
	function(key, config, source){
		this.DomainDedicated(key, config, source);
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







const DomainDelegated = Class.create(
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

const DomainSlave = Class.create(
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


const DnsTypeStatic = Class.create(
	"DnsTypeStatic",
	ConfigListAndMap,
	function(key, config, source){
		this.ConfigListAndMap(config, source || {});
		f.defineProperty(this, "key", key);
		if(source){
			for(let key in source){
				this.put(key, new DnsRecordStatic(key, source[key], 'static'));
			}
		}
		return this;
	}, {
		"toString" : {
			value : function(){
				return "[yamnrc DnsTypeStatic()]";
			}
		}
	}
);



const DnsRecordStatic = Class.create(
	"DnsRecordStatic",
	undefined,
	function(key, value, comment){
		Object.defineProperties(this, {
			"key" : {
				value : key
			},
			"value" : {
				value : value
			}
		});
		if(comment){
			f.defineProperty(this, "comment", comment);
		}
		return this;
	},{
		"key" : {
			value : undefined
		},
		"value" : {
			value : undefined
		},
		"comment" : {
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
	},{
		"compare" : {
			value : function(a, b){
				return a.key < b.key
					? -1
					: a.key === b.key
						? 0
						: 1
				;
			}
		}
	}
);





const Configuration = Class.create(
	"Configuration",
	ResolvableObject,
	function(source){
		this.ResolvableObject(this, source);
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
		"resolveDirectIP4" : {
			// leads to l6routes
			value : function(net){
				const result = {};
				for(var l of this.locations.list){
					if(l.routers.list.some(function(x){ return x.router === 'active'; })){
						const ips = l.resolveDirectIP4(net);
						for(const ip of (ips || [])){
							result[ip] = true;
						}
						continue;
					}
					for(var i of l.routers.list){
						if(i.router === 'active' && i.wan3){
							const ips = i.resolveDirectIP4(net);
							for(const ip of (ips || [])){
								result[ip] = true;
							}
						}
						continue;
					}
				}
				const keys = Object.keys(result);
				return keys.length ? keys : undefined;
			}
		},
		"resolveSmartIP4" : {
			value : function(net){
				{
					const result = this.resolveDirectIP4(net);
					if(result) return result;
				}
				{
					const result = [];
					for(var l of this.locations.list){
						for(var i of this.routers.list){
							if(i.router === 'testing' && i.wan3){
								result[i.wan3] = true;
							}
						}
					}
					return Object.keys(result);
				}
			}
		},
		"resolveForHost" : {
			value : function(host, net){
				const n = net || this.location && this.location.lans || null;
				{
					const r = this.routing.domains.makeStaticView(net).resolveForHost(host, n);
					if(r) return r;
				}
				if(false){
					const r = this.routing.domains.resolveForHost(host, n);
					if(r) return r;
				} 
				{
					const target = this.targets.map[host] || this.servers.map[host];
					return target && target.resolveSmartIP4(n) || undefined;
				}
			}
		},
		"view" : {
			// current View instance (null, location, server or router)
			value : null
		},
		"targetListDns" : {
			// all servers and targets related to DNS
			execute : "once", get : function(){
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
			execute : "once", get : function(){
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
		"networkForClient" : {
			value : function(ip){
				return this.location && this.location.networkForClient(ip) || undefined;
			}
		},
		"dnsViewLocal" : {
			execute : "once", get : function(){
				return this.routing.domains.makeStaticView(
					this.location && this.location.lans || null
					/* Networks.LOCAL */
				);
			}
		},
		"dnsViewGlobal" : {
			execute : "once", get : function(){
				return this.routing.domains.makeStaticView(null /*NetworkAddress.GLOBAL*/);
			}
		},
		"buildDnsView" : {
			value : function(net){
				return this.routing.domains.makeStaticView(net);
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
	"SourceObject" : SourceObject,
	"Location" : Location,
	"Locations" : Locations,
	"Server" : Server,
	"Servers" : Servers,
	"Router" : Router,
	"Routers" : Routers,
	"Target" : Target,
	"TargetStatic" : TargetStatic,
	"TargetMultiple" : TargetMultiple,
	"TargetSingle" : TargetSingle,
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
