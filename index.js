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
				return "[yamnrc ListAndMap]";
			}
		}
	});
}



function Location(key, source){
	const wan3 = source.wan3 || 
					source.routing && source.routing.external || 
					source.ext && source.ext.tcp && source.ext.tcp.ip
	;
	const wan6 = source.wan6 || 
					source.routing && source.routing.external || 
					source.ext && source.ext.web && source.ext.web.ip || 
					wan3
	;
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
		// Array of external IPs for Layer3 access 
		value : null
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
	"toString" : {
		value : function(){
			return "[yamnrc Location(" + this.title + ")]";
		}
	}
});




function Server(key, source){
	Object.defineProperties(this, {
		"key" : {
			value : key
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
	"source" : {
		// the source 'settings' object, from which this object was constructed
		value : null
	},
	"toString" : {
		value : function(){
			return "[yamnrc Server]";
		}
	}
});

function Router(key, source){
	this.Server(key, source);
	Object.defineProperties(this, {
		"router" : {
			value : source.router
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
	"toString" : {
		value : function(){
			return "[yamnrc Router(" + this.key + ")]";
		}
	}
});








function Target(key, source){
	Object.defineProperties(this, {
		"key" : {
			value : key
		},
		"source" : {
			value : source
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
	"source" : {
		// the source 'settings' object, from which this object was constructed
		value : null
	},
	"toString" : {
		value : function(){
			return "[yamnrc Target]";
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
				const location = new Location(key, settings);
				this.put(key, location);
			}
		}
	},
	"toString" : {
		value : function(){
			return "[yamnrc Locations]";
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
					? new Router(key, settings)
					: new Server(key, settings)
				;
				this.put(key, server);
			}
		}
	},
	"toString" : {
		value : function(){
			return "[yamnrc Servers]";
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
				server.Router && this.put(key, server);
			}
		}
	},
	"toString" : {
		value : function(){
			return "[yamnrc Routers]";
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
		"routing" : {
			value : new Routing(this, source.routing)
		},
		"targets" : {
			value : new ListAndMap()
		},
		"source" : {
			value : source
		},
	});
	
	this.locations.initializeParse();
	this.servers.initializeParse();
	
	this.routers.initializeParse();
	
	for(let key in (this.targets || {})){
		const settings = this.targets[key];
		this.targets.put(key, new Target(key, settings));
	}
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
		"view" : {
			// current View instance (null, location, server or router)
			value : null
		},
		"source" : {
			// the source 'settings' object, from which this object was constructed
			value : null
		},
		"makeViewForLocation" : {
			value : function(location){
				if(!location){
					return undefined;
				}
				{
					const result = new Configuration(this.source);
					Object.defineProperties(result, {
						"location" : {
							value : location
						},
						"view" : {
							value : location
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
					const location = this.locations.map[server.source.location];
					const result = new Configuration(this.source);
					Object.defineProperties(result, {
						"location" : {
							value : location || null
						},
						"server" : {
							value : server
						},
						"router" : {
							value : server.Router && server
						},
						"view" : {
							value : server
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
