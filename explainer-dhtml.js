function makeExplainer(div, parser){
    const btn = document.createElement("button");
    btn.innerHTML = "CLOSE";
    btn.onclick = function(){
        div.remove();
    };
    div.appendChild(btn);
}

module.exports = {
    "createPlane" : function(config){
        const div = document.createElement("div");
        div.className = "explainer";
        this.makeExplainer(div, config);
        document.body.appendChild(div);
    },
    "makeExplainer" : makeExplainer
};