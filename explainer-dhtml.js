function makeExplainer(div, parser){
    const btnClose = document.createElement("button");
    btnClose.innerHTML = "CLOSE";
    btnClose.onclick(div.parentElement.removeNode(div));
    div.appendChild(btnClose);
}

module.exports = {
    "makeExplainer" : makeExplainer
};