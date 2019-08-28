let inputCollaps;
document.addEventListener("DOMContentLoaded", function() {
    const selects = document.querySelector("select");
    M.FormSelect.init(selects);
    const collaps = document.querySelector(".collapsible");
    inputCollaps = M.Collapsible.init(collaps, {
        onOpenStart: () => {
            result.style = "opacity: 0;";
        },
        onCloseStart: () => {
            result.style = "opacity: 1;";
        }
    });
    setTimeout(() => {
        document.getElementById("panelAmount").value = 5715;
        document.getElementById("inverterAmount").value = 2;
        document.getElementById("mppAmount").value = 1;
        document.getElementById("stringMin").value = 15;
        document.getElementById("stringMax").value = 19;

        inputCollaps.open();
    }, 500);
});

const result = document.getElementById("result");
let data;

const check = (amount, strings) => {
    for(let i = strings.length - 1; i > -1; i--) {
        if(amount % strings[i] === 0) return strings[i];
    }
    return false;
};

const recalcMPP = () => {
    for(let i = 0; i < data.inputValues.inverter; i++) {
        data.inverter[i].mpp = [];
        for(let j = 0; j < data.inputValues.mpp; j++) {
            data.inverter[i].mpp.push({
                panels: Math.round(data.inverter[i].panels / data.inputValues.mpp),
                stringSize: undefined,
                strings: undefined
            });
        }

        //- Panelanzahl der MPP der Inverteranzahl abgleichen
        if(data.inverter[i].mpp.length > 1) {
            const panelSum = data.inverter[i].mpp.reduce((a, b) => ({ panels: a.panels + b.panels }));
            const mppDiff = data.inverter[i].panels - panelSum.panels;
            if(mppDiff !== 0) data.inverter[i].mpp[data.inverter[i].mpp.length - 1].panels += mppDiff;
        }
    }
};

const inverterShift = () => {
    for(let i = 0; i < data.inverter.length - 1; i++) {
        data.inverter[i].panels -= 1;
        data.inverter[i + 1].panels += 1;
    }
    recalcMPP();
};

const testMPP = (inverter, strings) => new Promise((resolve, reject) => {
    for(let j = 0; j < inverter.length; j++) {
        for(let i = 0; i < inverter[j].mpp.length; i++) {
            let lock = true;
            while (lock) {
                if(check(inverter[j].mpp[i].panels, strings)) {
                    inverter[j].mpp[i].stringSize = check(inverter[j].mpp[i].panels, strings);
                    inverter[j].mpp[i].strings = inverter[j].mpp[i].panels / inverter[j].mpp[i].stringSize;
                    lock = false;
                }
                else {
                    if(inverter[j].mpp.length === 1) return resolve(0);
                    if(inverter[j].mpp[i].panels <= 0) return resolve(0);
                    if(i + 1 >= inverter[j].mpp.length) {
                        i = 0;
                    }
                    inverter[j].mpp[i].panels -= 1;
                    inverter[j].mpp[i + 1].panels += 1;
                }
            }
        }
    }
    return resolve(1);
});

const calcDistribution = i => testMPP(data.inverter, data.strings)
.then(result => {
    if(result === 1) return printResult();
    if(i > Math.floor(data.panels / 100)) return printError();
    inverterShift();
    return calcDistribution(i + 1);
})
.catch(() => printError());

const printResult = () => {
    for(let i = 0; i < data.inverter.length; i++) {
        result.innerHTML += "<h6>Inverter " + (i + 1) + "</h6>";
        for(let j = 0; j < data.inverter[i].mpp.length; j++) {
            result.innerHTML += "<strong>MPP Tracker " + (j + 1) + "</strong><br>";
            result.innerHTML += "<span>&emsp;Panelamount: " + data.inverter[i].mpp[j].panels + "</span><br>";
            result.innerHTML += "<span>&emsp;Stringamount: " + data.inverter[i].mpp[j].strings + "</span><br>";
            result.innerHTML += "<span>&emsp;Stringsize: " + data.inverter[i].mpp[j].stringSize + "</span><br><br>";
        }
        result.innerHTML += "<hr>";
    }
};

const printError = () => {
    result.innerHTML = "No possible wiring available!";
    result.style = "color: red !important;";
    return;
};

const calc = () => {
    //- Ergebnissanzeige löschen
    result.innerHTML = "";

    //- Werte importieren
    const panels = Number(document.getElementById("panelAmount").value);
    const inverter = Number(document.getElementById("inverterAmount").value);
    const mpp = Number(document.getElementById("mppAmount").value);
    const stringMin = Number(document.getElementById("stringMin").value);
    const stringMax = Number(document.getElementById("stringMax").value);

    //- Datenset deklarieren
    data = {
        panels,
        inverter: [],
        strings: [],
        inputValues: {
            inverter,
            mpp,
            stringMin,
            stringMax
        }
    };

    //- Strings definieren
    if(stringMin < stringMax) {
        for(let i = stringMin; i <= stringMax; i++) {
            data.strings.push(i);
        }
    }
    else {
        for(let i = stringMax; i <= stringMin; i++) {
            data.strings.push(i);
        }
    }

    //- Panelanzahl durch Inverteranzahl dividieren
    for(let i = 0; i < inverter; i++) {
        data.inverter.push({
            panels: Math.round(data.panels / inverter),
            mpp: []
        });
    }

    //- Panelanzahl der Inverter der Gesamtanzahl abgleichen
    if(data.inverter.length > 1) {
        const panelSum = data.inverter.reduce((a, b) => ({ panels: a.panels + b.panels }));
        const inverterDiff = panels - panelSum.panels;
        if(inverterDiff !== 0) data.inverter[data.inverter.length - 1].panels += inverterDiff;
    }

    //- Panelanzahl je Inverter durch MPP Tracker dividieren.
    recalcMPP();

    inputCollaps.close();
    calcDistribution(0);
};