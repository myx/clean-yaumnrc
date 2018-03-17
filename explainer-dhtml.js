function makeExplainer(div, config){
    const output = document.createElement("div");
    const header = document.createElement("div");

    output.style = "position:absolute;padding-top:1.8em;left:0;top:0;width:100%;height:100%;background-color:#efe;color:#000;overflow:auto";
    header.style = "position:fixed;left:0;top:0;width:100%;height:1.8em;background-color:#eff;color:#000";

    div.appendChild(output);
    div.appendChild(header);

    function btn(name, explainer){
        const btn = document.createElement("button");
        btn.innerHTML = name;
        btn.onclick = function(){
            output.innerHTML = '';
            explainer(output);
        };
        header.appendChild(btn);
    }

    btn("CLOSE", function(output){
        div.remove();
    });

    function table(output, layout){
        const table = document.createElement("table");
        table.border = "1px";
        table.cellPadding = "3";
        table.cellPadding = "2";
        const columns = [];
        {
            const tr = document.createElement("tr");
            for(let column of layout.columns){
                const th = document.createElement("th");
                th.innerHTML = column.titleShort || column.title || column.name || column.id;
                tr.appendChild(th);
                columns.push(column.id || column.name);
            }
            table.appendChild(tr);
        }
        for(let row of layout.rows){
            const tr = document.createElement("tr");
            for(let column of columns){
                const td = document.createElement("td");
                td.innerHTML = row[column];
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        output.appendChild(table);
    }

    btn("SSH", function(output){
        table(output, config.makeSshAccessTable());
    });

    btn("CONTACTS", function(output){
        table(output, config.makeContactsTable());
    });

    btn("DNS", function(output){
        table(output, config.makeDnsTable());
    });
}

module.exports = {
    "createPlane" : function(config){
        const div = document.createElement("div");
        div.className = "explainer";
        div.style = "position:absolute;left:0;top:0;width:100%;height:100%;background-color:#eef;color:#000;overflow:auto";
        this.makeExplainer(div, config);
        document.body.appendChild(div);
    },
    "makeExplainer" : makeExplainer
};