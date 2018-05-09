{
	let Test = function Test(document, debugFn, parser, explainer){
		this.document = document;
		this.debugFn = debugFn;
		this.parser = parser;
		this.explainer = explainer;

		return this;
	}

	Test.prototype = {
		document : null,
		debugFn  : null,
		lpanel : null,
		output : null,
		target : null,

		stackLevel : 0,
		bmIndex : 0,

		out : function out(t,x,e,d){
			switch(arguments.length){
				case 0:
					d = this.document.createElement('hr');
					break;
				case 1:
					d = this.document.createElement('h2');
					d.innerHTML = t;
					break;
				default:
					d = this.document.createElement('div');
					t && (d.innerHTML = t + ": ");
					e = this.document.createElement(e || 'pre')
					e.innerHTML = x;
					d.appendChild(e);
			}
			this.target.appendChild(d);
		},

		makeUploader : function(div, config, source, closeFn){
			const output = document.createElement("div");
			const header = document.createElement("div");
		
			output.style = "position:absolute;left:0;top:0;width:100%;height:100%;background-color:#efe;color:#000;overflow:hidden";
			header.className = "epanel";
		
			const textArea = document.createElement("textarea");
			textArea.style = "position:absolute;left:0;top:0;padding:3em 2em;width:100%;height:100%;overflow:auto";
			textArea.value = source;
			output.appendChild(textArea);

			div.appendChild(output);
			div.appendChild(header);

			this.output = output;
			this.lpanel = null;
			this.target = output;

			function btn(name, action){
				const btn = document.createElement("button");
				btn.innerHTML = name;
				btn.onclick = function(){
					output.innerHTML = '';
					output.scrollTop = 0;
					output.scrollLeft = 0;
					action(output);
				};
				header.appendChild(btn);
			}
		
			btn("CANCEL", function(output){
				test.createParsedPlane(config);
				div.remove();
			});

			const test = this;
		
			btn("PROCESS EDITED CONFIG", function(output){
				const source = textArea.value;
				const object = JSON.parse(source);
				const parsed = test.parser.parse(object);
				test.source = source;
				test.createParsedPlane(parsed);
				div.remove();
			});

			setTimeout(function(){
				textArea.focus();
			}, 50);
		},

		makeParsed : function(div, config, closeFn){
			const output = document.createElement("div");
			const header = document.createElement("div");
		
			output.style = "position:absolute;left:0;top:0;width:100%;height:100%;background-color:#efe;color:#000;overflow:hidden";
			header.className = "epanel";
		
			const title = document.createElement("title");
			title.style = "display:block;margin:auto;font-size:200%;align:center;text-align:center;vertical-align:middle;overflow:auto";
			title.innerHTML = "Configuration is parsed.";
			output.appendChild(title);

			div.appendChild(output);
			div.appendChild(header);
		
			this.output = output;
			this.lpanel = null;
			this.target = output;

			function btn(name, action){
				const btn = document.createElement("button");
				btn.innerHTML = name;
				btn.onclick = function(){
					output.innerHTML = '';
					output.scrollTop = 0;
					output.scrollLeft = 0;
					action(output);
				};
				header.appendChild(btn);
			}

			const test = this;
		
			btn("CLOSE", function(output){
				test.createUploadPlane(config, test.source);
				div.remove();
			});

			const testFunction = window.testFunction;
		
			btn("NEW", function(output){
				test.createUploadPlane(config, "");
				div.remove();
			});
		
			btn("FORMAT", function(output){
				test.createUploadPlane(config, config.toSource());
				div.remove();
			});
		
			btn("CLEAN", function(output){
				test.createUploadPlane(config, config.toSourceNonSecure());
				div.remove();
			});
		
			btn("EXPLAIN", function(output){
				test.explainer.createPlane(config, function(){
					test.createParsedPlane(config);
				});
				div.remove();
			});
		
			btn("DEBUG", function(output){
				test.debugFn(test, config);
				div.remove();
			});
		},

		makeDebug : function(div, config, closeFn){
			const lpanel = document.createElement("div");
			const output = document.createElement("div");
			output.id = "output";
			lpanel.id = "lpanel";

			this.target = output;

			const header = document.createElement("div");
			header.className = "epanel";

			output.innerHTML = '';
			lpanel.innerHTML = '';

			div.appendChild(lpanel);
			div.appendChild(output);
			div.appendChild(header);
		
			this.output = output;
			this.lpanel = lpanel;
			this.target = output;

			function btn(name, action){
				const btn = document.createElement("button");
				btn.innerHTML = name;
				btn.onclick = function(){
					output.innerHTML = '';
					output.scrollTop = 0;
					output.scrollLeft = 0;
					action(output);
				};
				header.appendChild(btn);
			}
		
			const test = this;

			btn("CLOSE", function(output){
				test.createParsedPlane(config);
				div.remove();
			});

			btn("NEW", function(output){
				test.createUploadPlane(config, "");
				div.remove();
			});

			btn("EXPLAIN", function(output){
				test.explainer.createPlane(config, function(){
					test.createParsedPlane(config);
				});
				div.remove();
			});
		},

		createFullscreenDiv : function(className){
			const div = document.createElement("div");
			div.className = className;
			div.style = "position:absolute;left:0;top:0;width:100%;height:100%;background-color:#eef;color:#000;overflow:auto";
			return div;
		},

		createUploadPlane : function(config, source){
			const div = this.createFullscreenDiv("uploader");
			this.makeUploader(div, config, source);
			document.body.appendChild(div);
		},

		createParsedPlane : function(config){
			const div = this.createFullscreenDiv("parsed");
			this.makeParsed(div, config);
			document.body.appendChild(div);
		},

		createDebugPlane : function(config){
			const div = this.createFullscreenDiv("document");
			this.makeDebug(div, config);
			document.body.appendChild(div);
		},

		push : function push(title, id){
			let e, t = this.target;
			title && (e = this.document.createElement('h2'), e.innerHTML = title, t.appendChild(e));
			id && (e.id = id);
			t = this.document.createElement('blockquote');
			t.parent = this.target;
			this.target.appendChild(t);
			this.target = t;
			++this.stackLevel;
		},

		pop : function pop(){
			this.target = this.target.parent || this.output;
			--this.stackLevel;
		},

		nest : function nest(title, f){
			const index = ++this.bmIndex;
			if(this.stackLevel < 5){
				{
					const item = this.document.createElement("a");
					item.className = "lpanelItem";
					item.href = "#bm" + index;
					item.style.paddingLeft = this.stackLevel + "em";
					item.innerHTML = title;
					this.lpanel.appendChild(item);
				}
				{
					const item = this.document.createElement("span");
					item.innerHTML = "<a id=bm" + index + "/>";
					//this.target.appendChild(item);
				}
			}
		
			this.push(title, 'bm' + index);
			f(this.target);
			this.pop();
		}

	};

	module.exports = Test;

}
