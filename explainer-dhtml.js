function makeExplainer(div, parser){
    const btn = document.createElement("button");
    btn.innerHTML = "CLOSE";
    btn.onclick = function(){
        div.parentElement.removeNode(div);
    };
    div.appendChild(btn);
}

module.exports = {
    "createPlane" : function(config){
        const div = document.createElement("div");
        div.cssText = "position:absolute;left:0;right:0;width:100%;height:100%;margin:0;padding:0;background-color:#fff;color:#000";
        this.makeExplainer(div, config);
        document.appendChild(div);
    },
    "makeExplainer" : makeExplainer
};