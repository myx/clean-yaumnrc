function makeExplainer(div, config, closeFn) {
    const output = document.createElement("div");
    const header = document.createElement("div");

    output.style = "position:absolute;left:0;top:0;width:100%;height:100%;background-color:#efe;color:#000;overflow:auto";
    header.style = "position:fixed;right:1em;top:0;overflow:hidden;padding:0.3em;background-color:#eff;color:#000";

    div.appendChild(output);
    div.appendChild(header);

    function btn(name, action) {
        const btn = document.createElement("button");
        btn.style = "height:2em;line-height:1em;padding:0.3em;overflow:hodden";
        btn.innerHTML = name;
        btn.onclick = function () {
            output.innerHTML = '';
            output.scrollTop = 0;
            output.scrollLeft = 0;
            action(output);
        };
        header.appendChild(btn);
    }

    btn("CLOSE", function (output) {
        "function" === typeof closeFn && closeFn();
        div.remove();
    });

    function format(output, value) {
        if (!value) {
            output.innerHTML = value;
            return;
        }
        unrollList: if (value.list) {
            for (let i of value.list) {
                if (i === value) {
                    break unrollList;
                }
                const div = document.createElement('div');
                format(div, i);
                if (div.innerHTML) {
                    output.appendChild(div);
                }
            }
            return;
        }
        if (value.AbstractAddress) {
            output.innerHTML = (value.cidr || value.ip).replace(';', '<br/>');
            // output.innerHTML = value.networkCidr.replace(';', '<br/>');
            return;
        }
        output.innerHTML = value;
    }

	function title(output, text) {
        const title = document.createElement("h2");
		title.innerHTML = text;
		output.appendChild(title);
	}

    function table(output, layout) {
        const table = document.createElement("table");
        table.style = "margin:2em 0;";
        table.border = "1px";
        table.cellPadding = "3";
        table.cellPadding = "2";
        table.columns = [];

        table.filtersChanged = function () {
            table.removeContent();
            table.fillContent();
        };

        table.removeContent = function () {
            for (const item of this.querySelectorAll('.content')) {
                item.parentNode.removeChild(item);
            }
        };

        table.onContentClick = function () {
            const index = Array.prototype.indexOf.call(this.parentNode.children, this);
            const input = table.querySelector('.filters th:nth-of-type(' + (index + 1) + ') input');
            if (input.value === this.textContent) {
                input.value = '';
            } else {
                input.value = this.textContent;
            }
            table.filtersChanged();
        };

        table.fillContent = function () {
            const filterValues = {};
            for (const item of table.querySelectorAll('input')) {
                filterValues[item.columnId] = item.value;
            }
            let index = 0;
            for (const row of layout.rows) {
                const tr = document.createElement("tr");
                tr.classList.add('content');
                {
                    const td = document.createElement("td");
                    td.innerHTML = ++index;
                    tr.appendChild(td);
                }
                let skip = false;
                for (const column of this.columns) {
                    const td = document.createElement("td");
                    if (filterValues[column] && !~row[column].toString().indexOf(filterValues[column])) {
                        skip = true;
                        break;
                    }
                    td.addEventListener('dblclick', table.onContentClick);
                    format(td, row[column]);
                    tr.appendChild(td);
                }
                if (skip === false) {
                    table.appendChild(tr);
                }
            }
        };

        table.fillHeaders = function () {
            const tr = document.createElement("tr");
            const trFilters = document.createElement("tr");
            trFilters.classList.add('filters');
            {
                const th = document.createElement("th");
                th.innerHTML = "#";
                tr.appendChild(th);
                const thFilter = document.createElement('th');
				thFilter.innerHTML = "&nbsp;";
                trFilters.appendChild(thFilter);
            }
            for (const column of layout.columns) {
                const th = document.createElement("th");
                th.innerHTML = column.titleShort || column.title || column.name || column.id;
                tr.appendChild(th);
                const columnId = column.id || column.name;
                this.columns.push(columnId);
                const thFilter = document.createElement('th');
				{
					const style = thFilter.style;
					style.position = 'relative';
					style.height = '1.1em';
				}
                const inputFilter = document.createElement('input');
				{
					inputFilter.columnId = columnId;
					const style = inputFilter.style;
					style.position = 'absolute';
					style.top = '0';
					style.left = '0';
					style.width = '100%';
					style.height = '100%';
					style.boxSizing = 'border-box';
					inputFilter.addEventListener('input', function () {
						table.filtersChanged();
					});
				}
                thFilter.appendChild(inputFilter);
                trFilters.appendChild(thFilter);
            }
            table.appendChild(tr);
            table.appendChild(trFilters);
        };

        table.fillHeaders();
        table.fillContent();
        output.appendChild(table);
    }

    btn("SSH", function (output) {
		title(output, "SSH Access");
        table(output, config.makeSshAccessTable());
    });

    btn("CONTACTS", function (output) {
		title(output, "Contact Information");
        table(output, config.makeContactsTable());
    });

    btn("LOCATIONS", function (output) {
		title(output, "Infrastructure Locations");
        table(output, config.makeLocationsTable());
    });

    btn("DNS-WAN", function (output) {
		title(output, "DNS Records (WAN-view)");
        table(output, config.makeDnsTable(null));
    });

    btn("DNS-ALL", function (output) {
		title(output, "DNS Records (ALL)");
        table(output, config.makeDnsTable());
    });

    btn("MON-WAN", function (output) {
		title(output, "Monitoring tests (WAN)");
        table(output, config.makeMonitoringTable(null));
    });

    btn("MON-ALL", function (output) {
		title(output, "Monitoring tests (ALL)");
        table(output, config.makeMonitoringTable());
    });

    btn("FWD", function (output) {
		title(output, "Port Forwarding (NAT)");
        table(output, config.makePortForwardTable());
    });

    btn("SERVERS", function (output) {
		title(output, "Server List");
        table(output, config.makeServersTable());
    });
}

module.exports = {
    "createPlane": function (config, closeFn) {
        const div = document.createElement("div");
        div.className = "explainer";
        div.style = "position:absolute;left:0;top:0;width:100%;height:100%;background-color:#eef;color:#000;overflow:auto";
        this.makeExplainer(div, config, closeFn);
        document.body.appendChild(div);
    },
    "makeExplainer": makeExplainer
};
