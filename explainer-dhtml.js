function makeExplainer(div, parser){
    const btnClose = document.createElement("button");
    btn.innerHTML = "CLOSE";
    btnClose.onclick(div.parentElement.removeNode(div));
    div.appendChild(btnClose);
}

module.exports = {
    "makeExplainer" : makeExplainer
};