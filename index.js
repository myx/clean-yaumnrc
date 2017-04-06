function ListAndMap(){
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
}

{
	Object.defineProperties(ListAndMap.prototype, {
		"ListAndMap" : {
			value : ListAndMap
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
	});
}



function Location(config, key, source){
	
	const wan3 = source.wan3 || 
					source.routing && source.routing.external || 
					source.ext && source.ext.tcp && source.ext.tcp.ip
	;
	
	const wan6 = source.wan6 || 
					source.routing && source.routing.external || 
					source.ext && source.ext.web && source.ext.web.ip || 
					wan3
	;

	const tap3 = source.tap3 || 
					source.routing && source.routing.tap
	;
	
	
	const lan3 = [].concat(
		source.lan3 || source.routing && source.routing.gateway
	).filter(function(x){ return !!x; });
	
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
		"lan3" : {
			value : lan3
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
}

Object.defineProperties(Location.prototype, {
	"Location" : {
		value : Location
	},
	"wan6" : {
		// Array of external IPs for Layer6 access 
		value : null
	},
	"wan3" : {
		// external IP for Layer3 access (gateway - only one IP per location)
		value : null
	},
	"lan3" : {
		// Array of local IPs for Layer3 access (gateway, dns-server) 
		value : null
	},
	"tap3" : {
		// Array of local IPs for Layer3 access (tap to inter-cluster vpn) 
		value : null
	},
	"wan3smart" : {
		// Array of external IPs for Layer3 access (length is likely 1 or 0, but could have several WAN IPs of all the routers) 
		get : function(){
			if(this.wan3){
				return [].concat(this.wan3);
			}
			const result = [];
			for(var i of this.routers.list){
				if(i.router === 'active'&& i.wan3){
					result.push(i.wan3);
				}
			}
			if(result.length == 0) for(var i of this.routers.list){
				if(i.router === 'testing' && i.wan3){
					result.push(i.wan3);
				}
			}
			return result;
		}
	},
	"lan3smart" : {
		// Array of local IPs for Layer3 access (length is likely 1 or 0, but could have several LAN IPs of all the routers) 
		get : function(){
			if(this.lan3){
				return [].concat(this.lan3);
			}
			const result = [];
			for(var i of this.routers.list){
				if((i.router === 'active' || i.router === 'testing') && i.lan3){
					result.push(i.lan3);
				}
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
				"lan3" : this.lan3 && this.lan3.length && this.lan3 || null,
				"tap3" : this.tap3 || undefined,
			};
		}
	},
	"toString" : {
		value : function(){
			return "[yamnrc Location(" + this.title + ")]";
		}
	}
});




function Server(config, key, source){
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
	return this;
}

Object.defineProperties(Server.prototype, {
	"Server" : {
		value : Server
	},
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
		value : "use-wan"
	},
	"wan3smart" : {
		get : function(){
			if(this.modeDns === "use-wan" && this.wan3){
				return [ this.wan3 ];
			}
			if(!this.location){
				return this.config.wan3smart;
			}
			return this.location.wan3smart;
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
		get : function(mapInitial){
			return [ this ];
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
});

function Router(config, key, source){
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
}

Object.defineProperties(Router.prototype = Object.create(Server.prototype), {
	"Router" : {
		value : Router
	},
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
});








function Target(config, key, source){
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
}

Object.defineProperties(Target.prototype, {
	"Target" : {
		value : Target
	},
	"key" : {
		// key of given instance 
		value : null
	},
	"modeDns" : {
		// null, 'use-wan', 'use-router', 'local', 'remote', 'static'
		value : null
	},
	"endpointsToMap" : {
		value : function(mapInitial){
			const map = mapInitial || {};
			for(let key of [].concat(this.source.target || [])){
				if(~key.indexOf('://')){
					map[key] = new TargetStatic(this.config, this.key, this.source);
					continue;
				}
				if(key !== this.key){
					const target = this.config.targets.map[key];
					if(target){
						if(target != this){
							target.endpointsToMap(map);
							continue;
						}
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
	"endpointsMap" : {
		get : function(){
			return this.endpointsToMap({});
		}
	},
	"endpointsList" : {
		get : function(mapInitial){
			return Object.values(this.endpointsMap);
		}
	},
	"wan3smart" : {
		get : function(){
			if(this.modeDns === 'use-router'){
				return this.config.wan3smart;
			}
			const map = {};
			for(const target of this.endpointsList){
				if(this.modeDns === 'use-wan' && target.wan3){
					map[target.wan3] = true;
					continue;
				}
				for(const address of (target.location ? target.location.wan3smart : this.config.wan3smart)){
					map[address] = true;
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
});




function TargetStatic(config, key, source){
	this.Target(config, key, source);
	Object.defineProperties(this, {
		"http" : {
			value : source.http || source.target[0]
		},
		"https" : {
			value : source.https || source.target[1]
		},
		"wan3smart" : {
			get : function(){
				return this.location ? this.location.wan3smart : this.config.wan3smart;
			}
		},
	});
	return this;
}


Object.defineProperties(TargetStatic.prototype = Object.create(Target.prototype), {
	"TargetStatic" : {
		value : TargetStatic
	},
	"http" : {
		value : null
	},
	"https" : {
		value : null
	},
	"modeDns" : {
		// null, 'use-wan', 'use-router', 'local', 'remote', 'static'
		value : "use-router"
	},
	"toString" : {
		value : function(){
			return "[yamnrc TargetStatic("+this.key+")]";
		}
	}
});












function Locations(config, source){
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
}

Object.defineProperties(Locations.prototype = Object.create(ListAndMap.prototype), {
	"Locations" : {
		value : Locations
	},
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
});




function Servers(config, source){
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
}

Object.defineProperties(Servers.prototype = Object.create(ListAndMap.prototype), {
	"Servers" : {
		value : Servers
	},
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
});






function Routers(config, source){
	this.Servers(config, source);
	return this;
}

Object.defineProperties(Routers.prototype = Object.create(Servers.prototype), {
	"Routers" : {
		value : Routers
	},
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
});

Object.defineProperties(Routers, {
	"FILTER_ACTIVE" : {
		value : function(x){
			return x && x.router === 'active';
		}
	},
});







function Targets(config, source){
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
}



Object.defineProperties(Targets.prototype = Object.create(ListAndMap.prototype), {
	"Targets" : {
		value : Targets
	},
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
				const server = new Target(this.config, key, settings);
				this.put(key, server);
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
});












function Routing(config, source){
	Object.defineProperties(this, {
		"config" : {
			value : config
		},
		"source" : {
			value : source || {}
		},
	});
	return this;
}








function Configuration(source){
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
	
	return this;
}
{
	Object.defineProperties(Configuration.prototype, {
		"Configuration" : {
			value : Configuration
		},
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
				const result = [];
				for(var l of this.locations.list){
					if(l.wan3 && l.routers.list.some(function(x){ return x.router === 'active'; })){
						result.push(l.wan3);
						continue;
					}
					for(var i of l.routers.list){
						if(i.router === 'active' && i.wan3){
							result.push(i.wan3);
						}
					}
				}
				if(result.length == 0) for(var l of this.locations.list){
					for(var i of this.routers.list){
						if(i.router === 'testing' && i.wan3){
							result.push(i.wan3);
						}
					}
				}
				return result;
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
				const map = new Object(this.servers.map);
				for(const target of this.targets.list){
					map[target.key] = target;
				}
				return Object.values(map);
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
					targets		: this.targets.toSourceObject(),
				};
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc Configuration("+(this.view || '')+")]";
			}
		}
	});
}

module.exports = {
	"Location" : Location,
	"Locations" : Locations,
	"Server" : Server,
	"Servers" : Servers,
	"Router" : Router,
	"Routers" : Routers,
	"Target" : Target,
	

	// returns Configuration	
    "parse" : function (config) {
		return config
			? new Configuration(config)
			: undefined;
    }
};
