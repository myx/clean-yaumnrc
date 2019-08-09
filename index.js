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
		const p = constructor.prototype = inherit
			? Object.create(inherit.prototype || inherit)
			: {};
		if(properties){
			var k, d;
			for(k in properties){
				d = properties[k];
				if(d.execute === 'once' && 'function' === typeof d.get){
					const get = d.get;
					const key = k;
					d = Object.create(d);
					d.get = function(){
						const result = get.call(this);
						this === p || Object.defineProperty(this, key, { value : result });
						// console.log("createClass: >>> once: " + name + ", " + key);
						return result;
					};
				}
				Object.defineProperty(p, k, d);
			}
			// Object.defineProperties(p, properties);
		}
		if(name && !(properties && properties[name])){
			Object.defineProperty(p, name, { value : constructor });
		}
		if(statics){
			Object.defineProperties(constructor, statics);
		}
		if(name && !(statics && statics.toString)){
			Object.defineProperty(constructor, "toString", {
				value : function(){
					return "[class " + name + "]";
				}
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
			value : undefined
		},
		"mac" : {
			// optional
			value : undefined
		},
		"comment" : {
			// optional
			value : undefined
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
	function(ip, mac, comment){
		f.defineProperty(this, "ip", ip);
		mac && f.defineProperty(this, "mac", mac);
		comment && f.defineProperty(this, "comment", comment);
		return this;
	}, {
		"key" : {
			get : function(){
				return this.AbstractAddress.intForIPv4(ip);
			}
		},
		"bits" : {
			value : 32
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
					"127.0.0.1",
					undefined,
					"Global LOCALHOST"
				);
			}
		}
	}
);


const NetworkAddress = Class.create(
	"NetworkAddress",
	AbstractAddress,
	function(cidr, ip, bits, mac, key){
		const mask = (0xFFFFFFFF * (2 ** (32 - bits))) % 0x100000000;
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
		"networkObject" : {
			get : function(){
				const networkIp = this.network;
				return networkIp === this.ip ? this : new NetworkAddress(this.networkCidr, networkIp, this.bits, this.mac, this.key);
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
				return "[ListAndMap(" + this.list.length + ", [" + Object.keys(this.idx) + "])]";
			}
		}
	}
);


const IpRoute = Class.create(
	"IpRoute",
	undefined,
	function(dst, via, type){
		Object.defineProperties(this, {
			"dst" : {
				value : dst
			},
			"via" : {
				value : via
			},
			"type" : {
				value : type
			}
		});
		return this;
	},{
		"dst" : {
			value : undefined
		},
		"via" : {
			value : undefined
		},
		"type" : {
			value : undefined
		},
		"asClasslessStringFragment" : {
			get : function(){
				if(this.local || !this.via){
					return "";
				}
				const dst = this.dst;
				if(dst.bits === 0){
					return "0,  " + this.via.replace(/\./gi, ',');
				}
				{
					let net = dst.ip;
					(dst.bits <= 24) && (net = net.substr(0, net.lastIndexOf('.')));
					(dst.bits <= 16) && (net = net.substr(0, net.lastIndexOf('.')));
					(dst.bits <= 8 ) && (net = net.substr(0, net.lastIndexOf('.')));
					return dst.bits + ", " + net.replace(/\./gi, ',') + ",  " + this.via.replace(/\./gi, ',');
				}
			}
		},
		"toString" : {
			value : function(){
				return "[IpRoute(" + this.dst + ", " + this.via + ", " + this.type + ")]";
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
				return this.source;
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
						if(x.includes("---BEGIN CERTIFICATE---")){
							return "--- PUBLIC CERTIFICATE, hash: " + SourceObject.hashCode.call(x);
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
				return "[ConfigObject(" + this.config + "])]";
			}
		}
	}
);



const NetworkPortObject = Class.create(
	"NetworkPortObject",
	undefined,
	function(){
		this.net = null;
		this.mac = null;
		this.ip = [];
		this.ipv6 = [];
		return this;
	},{
		"net" : {
			value : undefined
		},
		"mac" : {
			value : undefined
		},
		"ip" : {
			value : undefined
		},
		"ipv6" : {
			value : undefined
		},
		"toString" : {
			value : function(){
				return "[NetworkPort(" + this.net + ", " + this.mac + ", " + this.ip + ", " + this.ipv6 + "])]";
			}
		}
	}
);


const NetworkPortsObject = Class.create(
	"NetworkPortsObject",
	undefined,
	function(){
		this.all = [];
		this.ip = [];
		this.ipv6 = [];
		return this;
	},{
		"addIP" : {
			value : function(x){
				if(!x){
					return;
				}
				if(x.push){
					for(var y of x){
						this.addIP(y);
					}
					return;
				}
				if(this.ip.indexOf(x) === -1){
					this.all.push(x);
					this.ip.push(x);
				}
			}
		},
		"addIPv6" : {
			value : function(x){
				if(!x){
					return;
				}
				if(x.push){
					for(var y of x){
						this.addIPv6(y);
					}
					return;
				}
				if(this.ipv6.indexOf(x) === -1){
					this.all.push(x);
					this.ipv6.push(x);
				}
			}
		},
		"addNetworkPortsObject" : {
			value : function(x){
				if(x && x.ip){
					for(var y of x.ip){
						this.addIP(y);
					}
				}
				if(x && x.ipv6){
					for(var y of x.ipv6){
						this.addIPv6(y);
					}
				}
			}
		},
		"normalize" : {
			value : function(){
				if(this.all.length === 0){
					return undefined;
				}
				if(this.ip && this.ip.length === 0){
					this.ip = undefined;
				}
				if(this.ipv6 && this.ipv6.length === 0){
					this.ipv6 = undefined;
				}
				return this;
			}
		},
		"removeIPv6" : {
			value : function(){
				if(this.all.length === 0){
					return undefined;
				}
				if(!this.ip || this.ip.length === 0){
					return undefined;
				}
				if(this.ipv6){
					this.all = this.ip;
					this.ipv6 = undefined;
				}
				return this;
			}
		},
		"toString" : {
			value : function(){
				return "[NetworkPorts(" + this.all + "])]";
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
			// null, 'use-wan', 'use-router', 'direct', 'direct-no-ipv6', 'local', 'remote', 'static'
			value : undefined
		},
		"wan3smart" : {
			// Array of external IPs for Layer3 access (length is likely 1 or 0, but could have several WAN IPs of all the routers) 
			execute : "once", get : function(){
				return (this.resolveSmart(null)||{}).ip;
			}
		},
		"lan3smart" : {
			// Array of local IPs for Layer3 access (length is likely 1 or 0, but could have several LAN IPs of all the routers) 
			execute : "once", get : function(){
				return (this.resolveSmart(this.config.location && this.config.location.lans || null)||{}).ip;
			}
		},
		"resolveDirect" : {
			value : function(net){
				throw new Error("Must re-implement, instance: " + this + ", net: " + net);
			}
		},
		"resolveSmart" : {
			value : function(net, own, parent/*, location*/){
				return this.resolveDirect(net, own, parent);
			}
		},
		"endpointsList" : {
			// to be functionally compatible with Target objects
			get : function(){
				return [ this ];
			}
		},
		"isLocal" : {
			get : function(){
				return this.config.location && this.location === this.config.location;
			}
		},
		"isRemote" : {
			get : function(){
				return !this.location || this.location !== this.config.location;
			}
		},
		"hasLocalEndpoints" : {
			execute : "once", get : function(){
				for(const target of this.endpointsList){
					if(target.location === this.config.location){
						return true;
					}
				}
				return false;
			}
		},
		"hasRemoteEndpoints" : {
			execute : "once", get : function(){
				for(const target of this.endpointsList){
					if(target.location !== this.config.location){
						return true;
					}
				}
				return false;
			}
		},
		"toString" : {
			value : function(){
				return "[ResolvableObject(" + this.key + "])]";
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
		const wan36 = source.wan36;
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
			"wan36" : {
				value : wan36
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
		"wan66" : {
			// Array of external IPv6s for Layer6 access 
			value : null
		},
		"wan3" : {
			// external IP for Layer3 access (gateway - only one IP per location)
			value : null
		},
		"wan36" : {
			// external IPv6 for Layer3 access (gateway - only one IPv6 per location)
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
		"resolveDirect" : {
			value : function(net){
				const result = new NetworkPortsObject();
				if(net && this.lan3 && net.location === this){
					var lan3, filtered, found = false;
					for(lan3 of this.lan3){
						filtered = net.filterIp(lan3);
						if(filtered){
							result.addIP(filtered);
							found = true;
						}
					}
					if(found){
						return result.normalize();
					}
				}
				if(this.wan3){
					result.addIP(this.wan3);
				}
				if(this.wan36){
					result.addIPv6(this.wan36);
				}
				return result.normalize();
			}
		},
		"resolveSmart" : {
			value : function(net, own/*, location*/){
				{
					const result = this.resolveDirect(net);
					if(result) return result;
				}
				{
					const result = new NetworkPortsObject();
					for(const r of this.routers.list.filter(Router.isActive)){
						result.addNetworkPortsObject( r.resolveSmart(net, true) );
					}
					if(!result.all.length) {
						for(const r of this.routers.list.filter(Router.isTesting)){
							result.addNetworkPortsObject( r.resolveSmart(net, true) );
						}
					}
					return result.normalize();
				}
			}
		},
		"resolveForHost" : {
			value : function(t, net){
				return this.config.resolveForHost(t, net || this.lans || null);
			}
		},
		"provisionView" : {
			execute : "once", get : function(){
				const result = new DhcpView(this.config, this);
				for(var i of this.servers.list){
					i.provisionFill(result);
				}
				return result;
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
					if(i.isActiveOrTesting && i.tap3){
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
		"isLocal" : {
			get : function(){
				return this === this.config.location;
			}
		},
		"isRemote" : {
			get : function(){
				return this !== this.config.location;
			}
		},
		"hasLocalEndpoints" : {
			get : function(){
				return this === this.config.location;
			}
		},
		"hasRemoteEndpoints" : {
			get : function(){
				return this !== this.config.location;
			}
		},
		"toSourceObject" : {
			value : function(){
				return {
					"name" : this.name || undefined,
					"title" : (this.source.title || this.title !== this.name) && this.title || undefined,
					"wan3" : this.wan3 || undefined,
					"wan36" : this.wan36 || undefined,
					"lan3" : this.lans && (this.lans.list ? this.lans.list.map(function(x){return x.toSourceObject();}) : this.lans.toSourceObject()) || undefined,
					"tap3" : this.tap3 || undefined,
				};
			}
		},
		"toString" : {
			value : function(){
				return "[Location(" + (this.key || this.title || undefined) + ")]";
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
		"wan36" : {
			// null or Array of external IPv6s for Layer3 access 
			execute : "once", get : function(){
				return this.source.wan && this.source.wan.ipv6;
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
		"groups" : {
			get : function(){
				const net = this.source.net;
				return net && [].concat(net) || [];
			}
		},
		"hasGroups" : {
			value : function(groups){
				for(var g1 of (groups || [])){
					for(var g2 of (this.groups)){
						if(g1 === g2){
							return true;
						}
					}
				}
				return false;
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
		"upstreamList" : {
			// to be functionnally compatible with Target objects
			get : function(){
				return [ new UpstreamObject() ];
			}
		},
		"resolveDirect" : {
			value : function(net){
				const result = new NetworkPortsObject();
				if(net && this.location === net.location){
					result.addIP( this.lan3 && net.filterIp(this.lan3, true) || this.wan3 );
					return result.normalize();
				}
				this.wan3 && result.addIP(this.wan3);
				this.wan36 && result.addIPv6(this.wan36);
				return result.normalize();
			}
		},
		"resolveSmart" : {
			value : function(net, own, parent/*, location*/){
				const resolveMode = parent && (parent.resolveMode || 'default') || this.resolveMode || 'direct';
				if(resolveMode === "use-wan"){
					const a = this.resolveDirect(null);
					if(a) return a;
				}
				if(resolveMode === "direct" || resolveMode === "direct-no-ipv6"){
					const a = this.resolveDirect(net);
					if(a) return resolveMode === "direct-no-ipv6" ? a.removeIPv6() : a;
				}
				if(own){
					return undefined;
				}
				if(this.location){
					return this.location.resolveSmart(net);
				}
				return this.config.resolveSmart(net);
			}
		},
		"provisionFill" : {
			value : function(dhcpView){
				const lan = this.source.lan;
				const wan = this.source.wan;

				const isMacAddress = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/i;

				const doWan = wan && wan.mac && isMacAddress.exec(wan.mac) && wan.ip;

				if(lan && lan.mac && isMacAddress.exec(lan.mac) && lan.ip){
					const network = this.location.networkForClient(lan.ip);
					const gateway = doWan
						? this.source.gateway || undefined
						: this.source.gateway || network && network.ip || undefined
					;
					dhcpView.addRecord(this.key + "_lan", lan.mac, this.key, lan.ip, network, this.groups, gateway);
				}
				if(doWan){
					dhcpView.addRecord(this.key + "_wan", wan.mac, this.key, wan.ip, undefined, undefined, this.source.gateway || undefined);
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
				return "[Server(" + this.key + ")]";
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
		"isActive" : {
			get : function(){
				return this.router === 'active';
			}
		},
		"isTesting" : {
			get : function(){
				return this.router === 'testing';
			}
		},
		"isActiveOrTesting" : {
			get : function(){
				return this.isActive || this.isTesting;
			}
		},
		"toString" : {
			value : function(){
				return "[Router(" + this.key + ")]";
			}
		}
	},{
		"isActive" : {
			// universal - ignores non-Router argument
			value : function(x){
				return x && x.router === 'active';
			}
		},
		"isTesting" : {
			// universal - ignores non-Router argument
			value : function(x){
				return x && x.router === 'testing';
			}
		},
		"isActiveOrTesting" : {
			// universal - ignores non-Router argument
			value : function(x){
				return x && (x.router === 'active' || x.router === 'testing');
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
		"resolveDirect" : {
			value : function(net, forceDirect){
				const result = new NetworkPortsObject();
				if(net){
					var t, lan3, found = false;
					for(t of this.endpointsList){
						if(t.location === net.location){
							lan3 = forceDirect 
								? t.lan3
								: t.lan3 && net.filterIp(t.lan3, true);
							if(lan3){
								result.addIP(lan3);
								found = true;
							}
						}
					}
					if(found){
						return result.normalize();
					}
				}
				
				if(forceDirect){
					const location = (net && net.location) || (this.config.location);
					if(location){
						var t, found = false;
						for(t of this.endpointsList){
							if(t.location === location){
								if(t.wan3){
									result.addIP(t.wan3);
									found = true;
								}
								if(t.wan36){
									result.addIPv6(t.wan36);
									found = true;
								}
							}
						}
						if(found){
							return result.normalize();
						}
					}
				}

				// from WAN
				{
					for(const t of this.endpointsList){
						t.wan3 && result.addIP(t.wan3);
						t.wan36 && result.addIPv6(t.wan36);
					}
					return result.normalize();
				}
			}
		},
		"resolveSmart" : {
			value : function(net, own, parent/*, location*/){
				const resolveMode = parent && parent.resolveMode || this.resolveMode;
				if(resolveMode === "use-router"){
					if(this.location){
						return this.location.resolveSmart(net);
					}
				}
				if(resolveMode === "use-local"){
					if(net && net.location){
						return net.location.resolveSmart(net);
					}
				}
				if(resolveMode === "direct" || resolveMode === "direct-no-ipv6"){
					const a = this.resolveDirect(net, true);
					if(a) return resolveMode === "direct-no-ipv6" ? a.removeIPv6() : a;
				}
				if(resolveMode === "use-wan"){
					{
						const result = this.resolveDirect(null);
						if(result) return result;
					}
					
					if(this.location){
						return this.location.resolveSmart(null);
					}

					{					
						const result = new NetworkPortsObject();
						for(const t of this.endpointsList){
							result.addNetworkPortsObject( t.resolveSmart(null, false, this) );
						}
						return result.normalize();
					}
				}
				if(this.location){
					return this.location.resolveSmart(net);
				}

				{
					const result = new NetworkPortsObject();
					for(const t of this.endpointsList){
						result.addNetworkPortsObject( t.resolveSmart(net, false, this) );
					}
					{
						if(!result.all.length) return undefined;
						if(net && net.location){
							if(result.all.length > 1){
								const view = net.location.resolveSmart(net);
								if(view) return view;
							}
						}
						return result.normalize();
					}
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
				return "[Target("+this.key+")]";
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
		"resolveDirect" : {
			// leads to l6routes
			value : function(net){
				if(this.location){
					return this.location.resolveDirect(net);
				}
				if(net){
					if(net.location){
						return net.location.resolveDirect(net);
					}
					if(this.config.location){
						return this.config.location.resolveDirect(net);
					}
				}
				return this.config.resolveDirect(net);
			}
		},
		"resolveSmart" : {
			value : function(net, own, parent/*, location*/){
				const resolveMode = parent && parent.resolveMode || this.resolveMode;
				if(own){
					return undefined;
				}
				if(resolveMode === "direct-no-ipv6"){
					const a = this.resolveDirect(net);
					if(a) return resolveMode === "direct-no-ipv6" ? a.removeIPv6() : a;
				}
				if(resolveMode === "direct" || resolveMode === "use-router"){
					return this.resolveDirect(net);
				}
				if(!resolveMode && !this.location){
					return this.config.resolveSmart(net);
				}
				if(resolveMode === "use-wan"){
					return this.resolveDirect(null);
				}
				return this.resolveDirect(net);
			}
		},
		"toString" : {
			value : function(){
				return "[TargetStatic("+this.key+")]";
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
				return "[TargetMultiple("+this.key+")]";
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
				return "[TargetSingle("+this.key+")]";
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
				return "[ConfigListAndMap(" + this.config + ", " + this.list.length + ", [" + Object.keys(this.idx) + "])]";
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
				return "[Locations(" + this.list.length + ", [" + Object.keys(this.idx) + "])]";
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
				return "[Servers(" + this.list.length + ", " + Object.keys(this.idx) + ")]";
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
				return "[Routers(" + this.list.length + ", " + Object.keys(this.idx) + ")]";
			}
		}
	},{
		"FILTER_ACTIVE" : {
			value : Router.isActive
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
				return "[Targets(" + this.list.length + ", " + Object.keys(this.idx) + ")]";
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
			}
		});
		return this;
	}, {
		"types" : {
			execute : "once", get : function(){
				return new RoutingTypes(this.config, this.source && this.source.types || undefined);
			}
		},
		"domains" : {
			execute : "once", get : function(){
				return new Domains(this.config, this.source && this.source.domains || undefined);
			}
		},
		"initializeParse" : {
			value : function(){
				this.domains.initializeParse();
			}
		},
		"toSourceObject" : {
			value : function(){
				return {
					"types" : this.types && this.types.toSourceObject() || undefined,
					"domains" : this.domains && this.domains.toSourceObject() || undefined
				};
			}
		},
		"toString" : {
			value : function(){
				return "[Routing()]";
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
					key[0] === '.' || (key = '.' + key);
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
				return "[Domains()]";
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
		"staticName" : {
			value : function(x){
				if(x.endsWith('.')){
					if('.' + x == this.key + '.'){
						return "@";
						return x;
					}
					if(x.endsWith(this.key + '.')){
						return x.substr(0, -this.key.length - 1);
						return x;
					}
					return undefined;
				}
				{
					if(x === "@"){
						return "@";
						return x + this.key + '.';
						// return this.key.substr(1) + '.';
					}
					if(x === "*"){
						return "*";
						return x + this.key + '.';
					}
					if('.' + x == this.key){
						return "@";
						return x + '.';
					}
					if(x.endsWith(this.key)){
						return x.substr(0, -this.key.length);
						return x + '.';
					}
					
					return x;
					return x + this.key + '.';
				}
			}
		},
		"filterName" : {
			value : function(x){
				if('.' + x == this.key){
					return "@";
					// return x + '.'; // always short
				}
				if(x.endsWith(this.key)){
					return x.substr(0, x.length - this.key.length);
					return x + '.';
				}
				if('.' + x == this.key + '.'){
					return "@";
					// return x; // always short
				}
				if(x.endsWith(this.key + '.')){
					return x.substr(0, x.length - this.key.length - 1);
					return x;
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
				return "[Domain("+this.key+")]";
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
				value : new this.DnsStatic(this, config, source && source.dns)
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
				function(domain, config, source){
					this.ConfigListAndMap(config, source || {});
					if(source) for(let key in source){
						const typeName = domain.staticName(key);
						typeName && this.put(
							typeName, 
							new DnsTypeStatic(typeName, config, source[key])
						);
					}
					return this;
				},{
					"toString" : {
						value : function(){
							return "[DnsStatic()]";
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
		"dnsTypeAAAA" : {
			execute : "once", get : function(){
				return this.ensureDnsTypeByName("AAAA");
			}
		},
		"dnsTypeCNAME" : {
			execute : "once", get : function(){
				return this.ensureDnsTypeByName("CNAME");
			}
		},
		"dnsTypeNS" : {
			execute : "once", get : function(){
				return this.ensureDnsTypeByName("NS");
			}
		},
		"dnsTypeMX" : {
			execute : "once", get : function(){
				return this.ensureDnsTypeByName("MX");
			}
		},
		"dnsTypeTXT" : {
			execute : "once", get : function(){
				return this.ensureDnsTypeByName("TXT");
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
				return "[DomainStatic("+this.key+")]";
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

				const recsA = result.dnsTypeA;
				const recs6 = result.dnsTypeAAAA;
				const recsN = result.dnsTypeNS;

				var name, aa, a4, a6, target;

				for(target of this.config.targetListDns){
					name = this.filterName(target.key);
					if(name){
						aa = target.resolveSmart(net);
						if(aa){
							a4 = aa.ip;
							a6 = aa.ipv6;
							if(a4 && a4.length){
								recsA.map[name] || recsA.put(name, new DnsRecordStatic(name, a4, 'target-4-' + target));
							}
							if(a6 && a6.length){
								recs6.map[name] || recs6.put(name, new DnsRecordStatic(name, a6, 'target-6-' + target));
							}
							if(name !== '@'){
								name = "*." + name;
								if(a4 && a4.length){
									recsA.map[name] || recsA.put(name, new DnsRecordStatic(name, a4, 'target-*-4-' + target));
								}
								if(a6 && a6.length){
									recs6.map[name] || recs6.put(name, new DnsRecordStatic(name, a6, 'target-*-6-' + target));
								}
							}
						}
					}
				}
				if(!recsA.map["*"] || !recsA.map["@"]){
					aa = this.config.resolveSmart(net);
					if(aa){
						a4 = aa.ip;
						a6 = aa.ipv6;
						if(a4 && a4.length){
							recsA.map["*"] || recsA.put("*", new DnsRecordStatic("*", a4, 'config-a4'));
							recsA.map["@"] || recsA.put("@", new DnsRecordStatic("@", a4, 'config-a4'));
						}
						if(a6 && a6.length){
							recs6.map["*"] || recs6.put("*", new DnsRecordStatic("*", a6, 'config-a6'));
							recs6.map["@"] || recs6.put("@", new DnsRecordStatic("@", a6, 'config-a6'));
						}
					}
				}

				for(target of this.config.locations.list){
					name = this.filterName(target.key);
					if(name){
						aa = target.resolveSmart(net);
						if(aa){
							a4 = aa.ip;
							a6 = aa.ipv6;
							if(a4 && a4.length){
								recsA.map[name] || recsA.put(name, new DnsRecordStatic(name, a4, 'location-4-'+target));
							} 
							if(a6 && a6.length){
								recs6.map[name] || recs6.put(name, new DnsRecordStatic(name, a6, 'location-6-'+target));
							} 
							if(name !== '@'){
								name = "*." + name;
								if(a4 && a4.length){
									recsA.map[name] || recsA.put(name, new DnsRecordStatic(name, a4, 'location-*-4-'+target));
								} 
								if(a6 && a6.length){
									recs6.map[name] || recs6.put(name, new DnsRecordStatic(name, a6, 'location-*-4-'+target));
								} 
							}
						}
					}
				}


				if(!recsN.map["@"]){
					const map = {};
					for(target of this.config.locations.list){
						name = DomainInfrastructure.prototype.filterName.call(this, target.key) || (target.key + this.key);
						aa = target.resolveSmart(net);
						if(aa){
							a4 = aa.ip;
							a6 = aa.ipv6;
							if(a4 && a4.length){
								map[name] = true;
								recsA.map[name] || recsA.put(name, new DnsRecordStatic(name, a4, 'location-@-4-'+target));
							} 
							if(a6 && a6.length){
								map[name] = true;
								recs6.map[name] || recs6.put(name, new DnsRecordStatic(name, a6, 'location-@-6-'+target));
							} 
						}
					}
					recsN.put("@", new DnsRecordStatic("@", Object.keys(map), 'config-n'));
				}

				recsA.sort(DnsRecordStatic.compare);
				recs6.sort(DnsRecordStatic.compare);
				recsN.sort(DnsRecordStatic.compare);
				
				return result;
			},
		},
		"toString" : {
			value : function(){
				return "[DomainDedicated("+this.key+")]";
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
				if('.' + x == this.key){
					return "@";
					// return x + '.'; // always short
				}
				if(x.endsWith(this.key)){
					return x.substr(0, x.length - this.key.length);
					return x + '.';
				}

				for(let d of this.config.routing.domains.list){
					if(x.endsWith(d.key)){
						if(!d.DomainInfrastructure){
							return undefined;
						}
						return x.substr(0, x.length - d.key.length);
						return x.substr(0, x.length - d.key.length) + this.key + '.';
					}
				}

				if(x.endsWith('.')){
					return x;
				}

				/** 
				 * 3-rd party domains we prefix to instrastructure zones
				 */
				return x;
				return x + this.key + '.';
			}
		},
		"toString" : {
			value : function(){
				return "[DomainInfrastructure("+this.key+")]";
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
				return "[DomainDelegated("+this.key+")]";
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
				return "[DomainSlave("+this.key+")]";
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
				return "[DnsTypeStatic("+this.key+")]";
			}
		}
	}
);



const DnsRecordStatic = Class.create(
	"DnsRecordStatic",
	undefined,
	function(key, value, comment){
		Object.defineProperties(this, {
			"key" : { value : key },
			"value" : {	value : value }
		});
		comment && Object.defineProperty(this, "comment", { value : comment });
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
				return "[DnsRecordStatic("
					+ this.key
					+ (this.comment 
						? ", comment: " + this.comment 
						: ""
					) 
					+ ")]"
				;
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



const DnsValueStatic = Class.create(
	"DnsValueStatic",
	undefined,
	function(value, comment){
		Object.defineProperty(this, "value", { value : value });
		comment && Object.defineProperty(this, "comment", { value : comment });
		return this;
	},{
		"value" : {
			value : undefined
		},
		"comment" : {
			value : undefined
		},
		"toSourceObject" : {
			value : function(){
				if(this.comment){
					return { 
						"value" : this.value, 
						"comment" : this.comment 
					};
				}
				return this.value;
			}
		},
		"toString" : {
			value : function(){
				if(this.comment){
					return this.value + " ; " + this.comment;
				}
				return this.value;
			}
		}
	}
);



const DhcpView = Class.create(
	"DhcpView",
	ConfigListAndMap,
	function(config, location){
		this.ConfigListAndMap(config);
		location && f.defineProperty(this, "location", location);
		return this;
	},{
		"lans" : {
			get : function(){
				return this.location && this.location.lans || this.config && this.config.location && this.config.location.lans;
			}
		},
		"addRecord" : {
			value : function(key, mac, host, ip, network, groups, defaultGateway){
				const record = new DhcpHost(this.config, this, key, mac, host, ip, network, groups, defaultGateway);
				this.put(record.key, record);
				return record;
			}
		},
		"toString" : {
			value : function(){
				return "[DhcpView(" + this.location + ", size: " + this.list.length + ")]";
			}
		}
	}
);

const DhcpHost = Class.create(
	"DhcpHost",
	ConfigObject,
	function(config, view, key, mac, host, ip, network, groups, defaultGateway){
		this.ConfigObject(config);
		if(!mac){
			throw new Error("DhcpHost requires 'mac'-address!");
		}
		if(!host){
			throw new Error("DhcpHost requires 'host'-name!");
		}
		if(!ip){
			throw new Error("DhcpHost requires 'ip'-address!");
		}
		Object.defineProperties(this, {
			"mac" : {
				value : mac
			},
			"host" : {
				value : host
			},
			"ip" : {
				value : ip
			},
			"view" : {
				value : view
			},
			"groups" : {
				value : groups && groups.length && groups || undefined
			},
			"gateway" : {
				value : defaultGateway
			}
		});
		if(key){
			f.defineProperty(this, "key", key);
		}else{
			f.defineProperty(this, "key", host + '_' + mac.replace(/\:/g, ''));
		}
		network && f.defineProperty(this, "network", network);
		return this;
	},{
		"key" : {
			value : undefined
		},
		"host" : {
			value : undefined
		},
		"mac" : {
			value : undefined
		},
		"ip" : {
			value : undefined
		},
		"resolver" : {
			execute : "once", get : function(){
				return this.network && this.network.ip || undefined;
			}
		},
		"networkIp" : {
			get : function(){
				return this.network && this.network.network || undefined;
			}
		},
		"networkInt" : {
			get : function(){
				return this.network && this.network.networkInt;
			}
		},
		"networkMask" : {
			get : function(){
				return this.network && this.network.mask;
			}
		},
		"networkBits" : {
			get : function(){
				return this.network && this.network.bits;
			}
		},
		"networkCidr" : {
			get : function(){
				return this.network && this.network.networkCidr;
			}
		},
		"network" : {
			value : undefined
		},
		"routeLocal" : {
			get : function(){
				if(!this.network){
					return undefined;
				}
				const route = new IpRoute(this.network.networkObject, undefined, 'local2');
				route.local = true;
				return route;
			}
		},
		"routeGlobal" : {
			get : function(){
				const gateway = this.gateway;
				if(!gateway){
					return undefined;
				}
				const route = new IpRoute(NetworkAddress.GLOBAL, gateway, 'default');
				route.global = true;
				return route;
			}
		},
		"routes" : {
			execute : "once", get : function(){
				const location = this.view.location || this.network && this.network.location || this.config.location;
				if(!location){
					return undefined;
				}
				const network = this.network || location.networkForClient(this.ip);
				if(!network){
					return undefined;
				}
				const result = [ this.routeLocal ];

				const groups = this.groups;
				if(groups){
					const localGw = network.ip;
					const networks = new Set();
					for(var s of location.config.servers.list){
						if(!s.lan3 || !s.hasGroups(groups)){
							// not related
							continue;
						}
						const level2 = network.containsIp(s.lan3);
						if(s.location === location && level2){
							// Level2 accessible
							continue;
						}
						// lans: different but related network
						if(!level2){
							const net = location.networkForClient(s.lan3);
							if(net){
								networks.add(net);
								continue;
							}
						}
						// taps: same network / different location
						{
							result.push(new IpRoute(f.parseNetwork(s.lan3), localGw, "remote"));
							continue;
						}
					}

					for(var destination of networks.values()){
						result.push(new IpRoute(destination, localGw, "local3"));
					}
				}

				const global = this.routeGlobal;
				global && result.push(global);

				return result;
			}
		},
		"routesAsClasslessString" : {
			execute : "once", get : function(){
				return this.routes && this.routes.reduce(function(r, x){
					const fragment = x.asClasslessStringFragment;
					return fragment 
						? r	
							? r + ",   " + fragment
							: fragment
						: r;
				}, '');
			}
		},
		"toSourceObject" : {
			value : function(){
				return {
					"mac" : this.mac,
					"ip" : this.ip,
					"host" : this.host
				};
			}
		},
		"toString" : {
			value : function(){
				return "[DhcpHost(" + this.host + ", " + this.mac + ", " + this.ip + ")]";
			}
		}
	}
);





const RoutingTypes = Class.create(
	"RoutingTypes",
	ConfigListAndMap,
	function(config, source){
		this.ConfigListAndMap(config, source);
		this.initializeParse();
		return this;
	},{
		"initializeParse" : {
			value : function(){
				const types = this.source;
				if(types === undefined){
					return;
				}
				for(let key in types){
					const type = types[key];
					this.addRecord(key, type.extends, type.level3, type.level6);
				}
			}
		},
		"types" : {
			get : function(){
				return this.source;
			}
		},
		"addRecord" : {
			value : function(key, parent, level3, level6){
				const record = new RoutingType(this.config, key, parent, level3, level6);
				this.put(key, record);
				return record;
			}
		},
		"toString" : {
			value : function(){
				return "[RoutingTypes(" + " size: " + this.list.length + ")]";
			}
		}
	}
);







const RoutingType = Class.create(
	"RoutingType",
	ConfigObject,
	function(config, key, parent, level3, level6){
		this.ConfigObject(config);
		if(!key){
			throw new Error("RoutingType requires 'key'!");
		}
		Object.defineProperties(this, {
			"key" : {
				value : key
			},
			"parent" : {
				value : parent || undefined
			},
			"level3" : {
				value : level3 || undefined
			},
			"level6" : {
				value : level6 || undefined
			},
		});
		return this;
	},{
		"key" : {
			value : undefined
		},
		"parent" : {
			value : undefined
		},
		"level3" : {
			value : undefined
		},
		"level6" : {
			value : undefined
		},
		"toSourceObject" : {
			value : function(){
				return {
					"parent" : this.parent,
					"level3" : this.level3,
					"level6" : this.level6
				};
			}
		},
		"toString" : {
			value : function(){
				return "[RoutingType(" + this.key + ")]";
			}
		}
	}
);










const Monitoring = Class.create(
	"Monitoring",
	ConfigObject,
	function(config, source){
		this.ConfigObject(config, source || {});
		return this;
	}, {
		"templates" : {
			execute : "once", get : function(){
				return new MonitoringTemplates(this.config, (this.source || {}).templates);
			}
		},
		"notify" : {
			execute : "once", get : function(){
				return new MonitoringNotify(this.config, (this.source || {}).notify);
			}
		},
		"initializeParse" : {
			value : function(){
				this.templates.initializeParse();
				this.notify.initializeParse();
			}
		},
		"monitorForTarget" : {
			value : function(t){
				const monitor = t.source && t.source.monitor;
				if(undefined === monitor || null === monitor){
					return undefined;
				}
				if('string' === typeof monitor){
					return this.templates.map[monitor];
				}
				if(monitor.check || monitor.notify){
					return new MonitoringTemplate(this.config, "inl-" + t.key, monitor);
				}
				return null;
			}
		},
		"toSourceObject" : {
			value : function(){
				return {
					"templates" : this.templates && this.templates.toSourceObject() || undefined,
					"notify" : this.notify && this.notify.toSourceObject() || undefined
				};
			}
		},
		"toString" : {
			value : function(){
				return "[Monitoring()]";
			}
		}
	}
);









const MonitoringTemplates = Class.create(
	"MonitoringTemplates",
	ConfigListAndMap,
	function(config, source){
		this.ConfigListAndMap(config, source);
		this.initializeParse();
		return this;
	},{
		"initializeParse" : {
			value : function(){
				const templates = this.source;
				if(templates === undefined){
					return;
				}
				for(let key in templates){
					const template = templates[key];
					template && this.addRecord(key, template);
				}
			}
		},
		"addRecord" : {
			value : function(key, source){
				const record = new MonitoringTemplate(this.config, key, source);
				this.put(key, record);
				return record;
			}
		},
		"toString" : {
			value : function(){
				return "[MonitoringTemplates(" + " size: " + this.list.length + ")]";
			}
		}
	}
);





const MonitoringTemplate = Class.create(
	"MonitoringTemplate",
	ConfigObject,
	function(config, key, source){
		this.ConfigObject(config, source || {});
		if(!key){
			throw new Error("MonitoringTemplate requires 'key'!");
		}
		Object.defineProperties(this, {
			"key" : {
				value : key
			}
		});
		return this;
	},{
		"key" : {
			value : undefined
		},
		"extends" : {
			get : function(){
				return this.source.extends || undefined;
			}
		},
		"check" : {
			get : function(){
				return this.source.check || undefined;
			}
		},
		"notify" : {
			get : function(){
				return this.source.notify || undefined;
			}
		},
		"getChecksArray" : {
			value : function(all){
				if(!this.source.check){
					return [];
				}
				if(Array.isArray(this.source.check)){
					return this.source.check.map(function(x, idx){
						return new MonitoringCheck(this.config, this, idx, x);
					}, this);
				}
				return [ new MonitoringCheck(this.config, this, "only", this.source.check) ];
			}
		},
		"toString" : {
			value : function(){
				return "[MonitoringTemplate(" + this.key + ")]";
			}
		}
	}
);






const MonitoringCheck = Class.create(
	"MonitoringCheck",
	ConfigObject,
	function(config, template, key, source){
		this.ConfigObject(config, source || {});
		if(key === undefined){
			throw new Error("MonitoringCheck requires 'key' (index)!");
		}
		Object.defineProperties(this, {
			"template" : {
				value : template
			},
			"key" : {
				value : key
			},
			"protocol" : {
				value : this.source.protocol || undefined
			},
		});
		return this;
	},{
		"template" : {
			value : undefined
		},
		"key" : {
			value : undefined
		},
		"protocol" : {
			value : undefined
		},
		"urlForHost" : {
			value : function(fqdn){
				var query = "?protocol=" + this.protocol;
				for(let key of Object.keys(this.source)){
					switch(key){
						case "protocol":
							break;
						default:
							query += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(this.source[key]);
 					}
				}
				return this.protocol + "://" + fqdn + query;
			}
		},
		"toString" : {
			value : function(){
				return "[MonitoringCheck(" + this.key + ", asUrl: " + this.urlForHost("host.example.org") + ")]";
			}
		}
	}
);



















const MonitoringNotify = Class.create(
	"MonitoringNotify",
	ConfigListAndMap,
	function(config, source){
		this.ConfigListAndMap(config, source);
		this.initializeParse();
		return this;
	},{
		"initializeParse" : {
			value : function(){
				const types = this.source;
				if(types === undefined){
					return;
				}
				for(let key in types){
					this.addRecord(key, types[key]);
				}
			}
		},
		"addRecord" : {
			value : function(key, source){
				const record = new MonitoringNotificationTarget(this.config, key, source);
				this.put(key, record);
				return record;
			}
		},
		"toString" : {
			value : function(){
				return "[MonitoringNotify(" + " size: " + this.list.length + ")]";
			}
		}
	}
);







const MonitoringNotificationTarget = Class.create(
	"MonitoringNotificationTarget",
	ConfigObject,
	function(config, key, source){
		this.ConfigObject(config, source || {});
		if(!key){
			throw new Error("MonitoringNotificationTarget requires 'key'!");
		}
		Object.defineProperties(this, {
			"key" : {
				value : key
			}
		});
		return this;
	},{
		"key" : {
			value : undefined
		},
		"type" : {
			get : function(){
				return this.source.type;
			}
		},
		"name" : {
			get : function(){
				return this.source.name;
			}
		},
		"email" : {
			get : function(){
				return this.source.email;
			}
		},
		"phone" : {
			get : function(){
				return this.source.phone;
			}
		},
		"testing" : {
			get : function(){
				return this.source.testing;
			}
		},
		"list" : {
			get : function(){
				return this.source.list;
			}
		},
		"redirect" : {
			get : function(){
				return this.source.redirect;
			}
		},
		"toString" : {
			value : function(){
				return "[MonitoringNotificationTarget(" + this.key + ")]";
			}
		}
	}
);















const AbstractTable = Class.create(
	"AbstractTable",
	SourceObject,
	function(){
		Object.defineProperties(this, {
			"rows" : {
				value : []
			}
		});
		return this;
	},{
		"sortColumns" : {
			/**
			 * An array of column names to sort by
			 */
			value : undefined
		},
		"sortComparator" : {
			get : function(){
				const columns = this.sortColumns;
				if(!columns || !columns.length){
					return undefined;
				}
				var code = "return ";
				for(let i of columns){
					code += `a.${i} > b.${i} ? 1 : a.${i} < b.${i} ? -1 : `;
				}
				code += '0;';
				return new Function("a", "b", code);
			}
		},
		"sort" : {
			value : function(c){
				this.rows.sort(c || this.sortComparator);
			}
		},
		"columns" : {
			value : [
				{
					id : "name",
					title : "Server"
				},
				{
					id : "ssh",
					title : "command",
					cssClass : "code"
				}
			]
		},
		"rows" : {
			// array of maps
			value : null
		},
		"toSourceObject" : {
			value : function(){
				return {
					columns : this.columns,
					rows : this.rows
				};
			}
		}
	}
);




const SshAccessTable = Class.create(
	"SshAccessTable",
	AbstractTable,
	function(){
		this.AbstractTable();
		return this;
	},{
		"sortColumns" : {
			value : ["name", "location"]
		},
		"columns" : {
			value : [
				{
					id : "name",
					title : "Server"
				},
				{
					id : "location",
					title : "Location"
				},
				{
					id : "ssh",
					title : "Command",
					cssClass : "code"
				}
			]
		}
	}
);


const ContactsTable = Class.create(
	"ContactsTable",
	AbstractTable,
	function(){
		this.AbstractTable();
		return this;
	},{
		"sortColumns" : {
			value : ["name", "type", "contact"]
		},
		"columns" : {
			value : [
				{
					id : "key",
					title : "Key"
				},
				{
					id : "name",
					title : "Name"
				},
				{
					id : "type",
					title : "Type"
				},
				{
					id : "contact",
					title : "Contact"
				}
			]
		}
	}
);



const LocationsTable = Class.create(
	"LocationsTable",
	AbstractTable,
	function(){
		this.AbstractTable();
		return this;
	},{
		"sortColumns" : {
			value : ["location"]
		},
		"columns" : {
			value : [
				{
					id : "location",
					titleShort : "ID",
					title : "Location"
				},
				{
					id : "name",
					title : "Name"
				},
				{
					id : "title",
					title : "Title"
				},
				{
					id : "wan3",
					title : "WAN3"
				},
				{
					id : "wan36",
					title : "WAN36"
				},
				{
					id : "lans",
					title : "LAN3"
				},
				{
					id : "comment",
					title : "Comment"
				}
			]
		}
	}
);





const PortForwardTable = Class.create(
	"PortForwardTable",
	AbstractTable,
	function(){
		this.AbstractTable();
		return this;
	},{
		"sortColumns" : {
			value : ["view", "extPort"]
		},
		"columns" : {
			value : [
				{
					id : "view",
					title : "View"
				},
				{
					id : "extPort",
					title : "Ext Port"
				},
				{
					id : "type",
					title : "Type"
				},
				{
					id : "lclIp",
					title : "Local IP"
				},
				{
					id : "lclPort",
					title : "Local Port"
				},
				{
					id : "comment",
					title : "Comment"
				}
			]
		}
	}
);




const MonitoringTable = Class.create(
	"MonitoringTable",
	AbstractTable,
	function(){
		this.AbstractTable();
		return this;
	},{
		"sortColumns" : {
			value : ["view", "host", "type", "ip"]
		},
		"columns" : {
			value : [
				{
					id : "view",
					title : "View"
				},
				{
					id : "type",
					title : "Type"
				},
				{
					id : "host",
					title : "Host"
				},
				{
					id : "ip",
					title : "IP"
				},
				{
					id : "url",
					title : "As URL"
				},
				{
					id : "comment",
					title : "Comment"
				}
			]
		}
	}
);





const DnsTable = Class.create(
	"DnsTable",
	AbstractTable,
	function(){
		this.AbstractTable();
		return this;
	},{
		"sortColumns" : {
			value : ["name", "type", "domain"]
		},
		"columns" : {
			value : [
				{
					id : "view",
					title : "View"
				},
				{
					id : "domain",
					title : "Domain"
				},
				{
					id : "name",
					title : "Name"
				},
				{
					id : "type",
					title : "Type"
				},
				{
					id : "value",
					title : "Record Value"
				},
				{
					id : "comment",
					title : "Comment"
				}
			]
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
			"monitoring" : {
				value : new Monitoring(this, source.monitoring)
			},
		});
		
		this.locations.initializeParse();
		this.servers.initializeParse();
		this.targets.initializeParse();
		this.routers.initializeParse();
		this.routing.initializeParse();
		this.monitoring.initializeParse();
		
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
		"monitoring" : {
			// Monitoring configuration class instance
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
		"resolveDirect" : {
			// leads to l6routes
			value : function(net){
				const result = new NetworkPortsObject();
				for(var l of this.locations.list){
					if(l.routers.list.some(Router.isActive)){
						result.addNetworkPortsObject( l.resolveDirect(net) );
						continue;
					}
					for(var i of l.routers.list){
						if(i.isActive && i.wan3){
							result.addNetworkPortsObject( i.resolveDirect(net) );
						}
					}
				}
				return result.normalize();
			}
		},
		"resolveSmart" : {
			value : function(net){
				{
					const result = this.resolveDirect(net);
					if(result) return result;
				}
				{
					const result = new NetworkPortsObject();
					for(var l of this.locations.list){
						for(var i of l.routers.list){
							if(i.isTesting){
								i.wan3 && result.addIP(i.wan3);
								i.wan36 && result.addIPv6(i.wan36);
							}
						}
					}
					return result.normalize();
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
					return target && (target.resolveSmart(n)||{}).ip || undefined;
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
		"buildHostsView" : {
			value : function(net){
				const entries = {};
				const source = this.buildDnsView(
					net || this.location && this.location.lans || null
				).toSourceObject();
				for (const [domainKey, domain] of Object.entries(source)) {
					for (const [host, ip] of Object.entries((domain.dns || {}).A || {})) {
						let fqdn = host.endsWith('.') ? host.slice(0, -1) : host + domainKey;
						fqdn.startsWith("@.") && (fqdn = fqdn.substr(2));
						fqdn.startsWith("*.") || ip.forEach((ip) => {
							(entries[fqdn] || (entries[fqdn] = {}))[ip] = true;
						});
					}
				}
				for (const [key, map] of Object.entries(entries)) {
					entries[key] = Object.keys(map);
				}
				return entries;
			}
		},
		"buildPortForwardView" : {
			value : function(location){
				const entries = {};
				function add(entries, tcpShift, desc, lport, lip, comment){
					const darr = desc.split('/');
					const port = darr[0];
					if(!port){
						return;
					}
					const nport = Number(port||0) + tcpShift;
					const prot = darr[1] || undefined;
					if(!prot || prot === 'tcp'){
						const key = nport + '-tcp';
						entries[key] = {
							extPort : nport,
							lclPort : lport,
							lclIp : lip,
							type : 'tcp',
							comment : comment || '',
						};
					}
					if(!prot || prot === 'udp'){
						const key = nport + '-udp';
						entries[key] = {
							extPort : nport,
							lclPort : lport,
							lclIp : lip,
							type : 'udp',
							comment : comment || '',
						};
					}
				}

				const loc = location || this.location;
				const locKey = loc ? '-' + loc.key : '';

				servers: for(let s of loc.servers.list){
					if(s.location !== loc){
						continue servers;
					}
					if(!s.source.lan || !s.source.lan.ip){
						continue servers;
					}
					const network = loc.networkForClient(s.source.lan.ip);
					const lan3 = s === this.router ? "127.0.0.1" : ((s.resolveDirect(network || null) || {}).ip);
					if(!lan3){
						continue servers;
					}
					const tcpShift = undefined === s.source.tcpShift 
						? undefined
						: s.source.tcpShift | 0;
					if(!tcpShift){
						continue servers;
					}

					if(s.Router){
						add(entries, tcpShift, "2/tcp", 1001, lan3, "beaver-web" + locKey + "-" + s.key);
						add(entries, tcpShift, "3", 655, lan3, "beaver-tinc" + locKey + "-" + s.key);
					}

					const typeName = s.source.type;


					if(!typeName){
						continue servers;
					}

					const type = this.config.routing.types.map[typeName];
					// const type = ((this.source.routing||{}).types||{})[typeName];
					if(type){
						for(let nat in (type.level3||{})){
							const tgt = Number(type.level3[nat]||-1);
							add(entries, tcpShift, nat, tgt, lan3, "type-" + typeName + locKey + "-" + s.key);
						}
					}
				}

				return entries;
			}
		},
		"buildMonitoringView" : {
			value : function(location){
				const entries = {};
				function add(entries, target, monitor, check, ip, shift, comment){
					const key = target.key + ':' + check.protocol + ":" + (ip || '');
					if(entries[key] !== undefined){
						return;
					}
					entries[key] = {
						key : key,
						type : check.protocol,
						host : target.key,
						ip : ip || undefined,
						url : check.urlForHost(target.key),
						comment : comment || check.comment || monitor.comment || key
					};
				}

				const loc = location || this.location;
				const locKey = loc ? '-' + loc.key : '';

				/** l6 block */
				targets: for(let t of this.config.targets.list){
					const monitor = this.config.monitoring.monitorForTarget(t);
					if(monitor){
						const web = (t.resolveSmart(loc && loc.lans || null) || {}).ip;
						if(web){
							for(let check of monitor.getChecksArray(false)){
								// console.log(">>> l6: " + t + ", " + web);
								for(let address of web){
									add(entries, t, monitor, check, address, 0, "tgw-" + t.key);
								}
							}
						}
					}
				}

				servers: for(let s of this.config.servers.list){
					const tcpShift = s.source.tcpShift | 0;
					const monitor = this.config.monitoring.monitorForTarget(s);
					if(monitor) for(let check of monitor.getChecksArray(true)){
						if(loc === s.location){
							const lan3 = s.lan3;
							// console.log(">>> l3: " + s + ", " + lan3);
							lan3 && add(entries, s, monitor, check, lan3, 0, "srl-" + s.key);
						}
						{
							const wan3 = s.wan3;
							// console.log(">>> w3: " + s + ", " + wan3);
							wan3 && add(entries, s, monitor, check, wan3, 0, "srw-" + s.key);
						}
					}
				}

				return entries;
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
		"makeLocationsTable" : {
			value : function(){
				const table = new LocationsTable();
				const rows = table.rows;

				for(let l of this.locations.list){
					if(l.key) {
						rows.push({
							location : l.key,
							name : l.name || l.key || '',
							title : l.title || l.description || l.key || '',
							wan3 : l.wan3 || '',
							wan36 : l.wan36 || '',
							lans : l.lans || '',
							comment : l.comment || '',
						});
					}
				}

				table.sort();
				return table;
			}
		},
		"makeDnsTable" : {
			value : function(view){
				const table = new DnsTable();
				const rows = table.rows;

				const views = [];
				if(view === undefined || view === null){
					views.push({
						name : "WAN",
						view : this.buildDnsView(null)
					});
				}
				if(view === undefined) for(let l of this.locations.list){
					if(l.key && l.lans) {
						for(let n of l.lans.list){
							views.push({
								name : l.key + '-' + n.key,
								view : this.buildDnsView(n)
							});
						}
					}
				}
				for(let v of views){
					for(let d of v.view.list){
						if(d.dns && d.dns.list) for(let t of d.dns.list){
							if(t && t.list) for(let r of t.list){
								rows.push({
									view : v.name,
									domain : d.key,
									name : r.key,
									type : t.key,
									value : r.value || '',
									comment : r.comment || '',
								});
							}
						}
					}
				}

				table.sort();
				return table;
			}
		},
		"makeContactsTable" : {
			value : function(){
				const table = new ContactsTable();
				const rows = table.rows;

				const contacts = this.source.monitoring.notify;
				for(let key in contacts){
					const contact = contacts[key];
					rows.push({
						key : key,
						name : contact.name,
						type : contact.type,
						contact : contact.email || contact.phone || contact.redirect || (contact.list && contact.list.join(", "))
					});
				}

				table.sort();
				return table;
			}
		},
		"makeSshAccessTable" : {
			value : function(){
				const table = new SshAccessTable();
				const rows = table.rows;

				servers: for(let s of this.servers.list){
					const type = ((this.source.routing||{}).types||{})[s.source.type || 'default'];
					if(s.wan3){
						if(type && type.level6){
							const tgt = Number(type.level6.sshd||-1);
							if(tgt && tgt > 0){
								rows.push({
									name : s.key,
									location : s.location && s.location.key,
									ssh : "ssh " + s.key + " -p " + tgt,
								});
								continue servers;
							}
						} 
						rows.push({
							name : s.key,
							location : s.location && s.location.key,
							ssh : "ssh " + s.key
						});
						continue servers;
					}
					if(type){
						for(let nat in (type.level3||{})){
							const tgt = Number(type.level3[nat]||-1);
							if(nat == "22" || nat == "22/tcp" || tgt == 22){
								const nport = Number(nat.split('/')[0]||-1);
								const shift = Number(s.source.tcpShift||0) || 0;
								rows.push({
									name : s.key,
									location : s.location && s.location.key,
									ssh : "ssh " + s.key + " -p " + (shift + nport),
								});
								continue servers;
							}
						}
					}
				}

				table.sort();
				return table;
			}
		},
		"makePortForwardTable" : {
			value : function(){
				const table = new PortForwardTable();
				const rows = table.rows;

				const views = [];
				for(let l of this.locations.list){
					if(l.key && l.wan3) {
						views.push({
							name : l.key,
							view : this.buildPortForwardView(l)
						});
					}
				}
				for(let v of views){
					for(let dKey in v.view){
						let d = v.view[dKey];
						if(d.extPort) {
							rows.push({
								view : v.name,
								extPort : d.extPort,
								lclPort : d.lclPort,
								lclIp : d.lclIp,
								type : d.type,
								comment : d.comment || '',
							});
						}
					}
				}

				table.sort();
				return table;
			}
		},
		"makeMonitoringTable" : {
			value : function(view){
				const table = new MonitoringTable();
				const rows = table.rows;

				const views = [];
				if(view === undefined || view === null){
					views.push({
						name : "WAN",
						view : this.buildMonitoringView(null)
					});
				}
				if(view === undefined) for(let l of this.locations.list){
					if(l.key && l.wan3) {
						views.push({
							name : l.key,
							view : this.buildMonitoringView(l)
						});
					}
				}
				for(let v of views){
					for(let mKey in v.view){
						const m = v.view[mKey];
						if(m && m.key) {
							rows.push({
								view : v.name,
								key : v.key,
								type : m.type,
								host : m.host,
								ip : m.ip,
								url : m.url,
								comment : m.comment || '',
							});
						}
					}
				}

				table.sort();
				return table;
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
					monitoring	: this.monitoring.toSourceObject(),
					routing		: this.routing.toSourceObject(),
					targets		: this.targets.toSourceObject(),
				};
			}
		},
		"toString" : {
			value : function(){
				return "[Configuration("+(this.view || '')+")]";
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

	"AbstractTable" : AbstractTable,
	"SshAccessTable" : SshAccessTable,

	// returns Configuration	
    "parse" : function (config) {
		return config
			? new Configuration(config)
			: undefined;
    }
};
