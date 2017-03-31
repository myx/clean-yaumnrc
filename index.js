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
			// instance list
			value : null
		},
		"map" : {
			// instance map
			value : null
		},
		"keys" : {
			get : function(){
				return Object.keys(this.map);
			}
		},
		"idx" : {
			// instance map
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



function Location(key, settings){
	Object.defineProperties(this, {
		"key" : {
			value : key
		},
		"servers" : {
			value : new ListAndMap()
		},
		"routers" : {
			value : new ListAndMap()
		},
		"source" : {
			value : settings
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
	"servers" : {
		// ListAndMap instance 
		value : null
	},
	"routers" : {
		// ListAndMap instance 
		value : null
	},
	"source" : {
		// the source 'settings' object, from wich Location was constructed
		value : null
	},
	"toString" : {
		value : function(){
			return "[yamnrc Location]";
		}
	}
});

function Server(key, settings){
	this.key = key;
	this.source = settings;
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
		// the source 'settings' object, from wich Server was constructed
		value : null
	},
	"toString" : {
		value : function(){
			return "[yamnrc Server]";
		}
	}
});

function Router(key, settings){
	this.Server(key, settings);
	return this;
}

Object.defineProperties(Router.prototype = Object.create(Server.prototype), {
	"Router" : {
		value : Router
	},
	"toString" : {
		value : function(){
			return "[yamnrc Router]";
		}
	}
});

function Target(key, settings){
	this.key = key;
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
	"toString" : {
		value : function(){
			return "[yamnrc Target]";
		}
	}
});

function Configuration(){
	Object.defineProperties(this, {
		"locations" : {
			value : new ListAndMap()
		},
		"servers" : {
			value : new ListAndMap()
		},
		"routers" : {
			value : new ListAndMap()
		},
		"targets" : {
			value : new ListAndMap()
		},
	});
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
		"servers" : {
			// ListAndMap instance 
			value : null
		},
		"routers" : {
			// ListAndMap instance 
			value : null
		},
		"targets" : {
			// ListAndMap instance 
			value : null
		},
		"makeView" : {
			value : function(l6name){
			
			}
		},
		"makeNonSecure" : {
			value : function(){
				return ;
			}
		},
		"toString" : {
			value : function(){
				return "[yamnrc Configuration]";
			}
		}
	});
}

module.exports = {
	"Location" : Location,
	"Server" : Server,
	"Router" : Router,
	"Target" : Target,
	
	"FILTER_ACTIVE_ROUTERS" : function(x){
		return x && x.router === 'active';
	},

	// returns Configuration	
    "parse" : function (config) {
		if(!config){
			return undefined;
		}
		const result = new Configuration();
		
		for(let key in (config.locations || {})){
			const settings = config.locations[key];
			const location = new Location(key, settings);
			result.locations.put(key, location);
		}
		
		for(let key in (config.servers || {})){
			const settings = config.servers[key];
			const server = settings.router 
				? new Router(key, settings)
				: new Server(key, settings)
			;
			result.servers.put(key, server);
			settings.router && result.routers.put(key, server)
		}
		
		for(let key in (config.targets || {})){
			const settings = config.targets[key];
			result.targets.put(key, new Target(key, settings));
		}
		
        return result;
    }
};
