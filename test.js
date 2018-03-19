{
	let Test = function Test(document){
		this.document = document;

		this.output = document.getElementById('output');
		this.lpanel = document.getElementById('lpanel');
		this.target = output;

		return this;
	}

	Test.prototype = {
		document : null,
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

		prepare : function(Explainer, config){
			this.output.innerHTML = '';
			this.lpanel.innerHTML = '';

			const epanel = this.document.createElement("div");
			epanel.id = "epanel";
			epanel.onclick = function(){
				Explainer.createPlane(config);
			};
			this.output.appendChild(epanel);
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
