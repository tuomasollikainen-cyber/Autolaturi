let porssiHinnat = []; 
let priceChart;

window.onload = function() {
    haeSahkonHinnat();
    lataaTallennetutTiedot();
};

function lataaTallennetutTiedot() {
    // Lisätty shellyIp tallennettavien listaan
    const kentat = ['batterySize', 'chargePower', 'currentSoc', 'targetSoc', 'targetTime', 'shellyIp'];
    
    kentat.forEach(kenttaId => {
        const tallennettuArvo = localStorage.getItem(kenttaId);
        // Tarkistetaan, että elementti on olemassa (estää virheet, jos HTML:ää ei ole vielä päivitetty)
        const elementti = document.getElementById(kenttaId);
        if (tallennettuArvo && elementti) {
            elementti.value = tallennettuArvo;
        }
    });
}

async function haeSahkonHinnat() {
    try {
        const response = await fetch('https://api.spot-hinta.fi/TodayAndDayForward');
        if (!response.ok) throw new Error("API virhe");

        const data = await response.json();
        
        const nyt = new Date();
        nyt.setMinutes(0, 0, 0);
        
        const tasatunnit = data.filter(p => {
            const date = new Date(p.DateTime);
            return date.getMinutes() === 0;
        });
        
        porssiHinnat = tasatunnit.filter(p => new Date(p.DateTime) >= nyt).slice(0, 24);
        
        const labels = porssiHinnat.map(p => {
            const date = new Date(p.DateTime);
            return date.getHours().toString().padStart(2, '0') + ":00";
        });
        
        const priceValues = porssiHinnat.map(p => (p.PriceWithTax * 100).toFixed(2));

        piirraKuvaaja(labels, priceValues, 'Sähkön hinta (snt/kWh)');
    } catch (error) {
        console.error("Hinnanhaku epäonnistui:", error);
    }
}

function piirraKuvaaja(labels, data, otsikko) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    if (priceChart) priceChart.destroy();

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: otsikko,
                data: data,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                borderWidth: 2, fill: true, tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { 
                    ticks: { 
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 45
                    } 
                },
                y: { beginAtZero: false }
            }
        }
    });
}

document.getElementById('submitBtn').addEventListener('click', function() {
    const batterySize = parseFloat(document.getElementById('batterySize').value);
    const chargePower = parseFloat(document.getElementById('chargePower').value);
    const currentSoc = parseInt(document.getElementById('currentSoc').value);
    const targetSoc = parseInt(document.getElementById('targetSoc').value);
    const targetTime = document.getElementById('targetTime').value;
    const shellyIp = document.getElementById('shellyIp') ? document.getElementById('shellyIp').value : '';
    
    if (!batterySize || !chargePower || isNaN(currentSoc) || isNaN(targetSoc) || !targetTime) {
        naytaStatus("Täytä kaikki pakolliset kentät!", "#f8d7da", "#721c24");
        return;
    }

    if (currentSoc >= targetSoc) {
        naytaStatus("Akku on jo tavoitetasolla!", "#f8d7da", "#721c24");
        return;
    }

    // Tallennetaan syötteet
    localStorage.setItem('batterySize', batterySize);
    localStorage.setItem('chargePower', chargePower);
    localStorage.setItem('currentSoc', currentSoc);
    localStorage.setItem('targetSoc', targetSoc);
    localStorage.setItem('targetTime', targetTime);
    if (shellyIp) localStorage.setItem('shellyIp', shellyIp);

    const energyNeeded = batterySize * ((targetSoc - currentSoc) / 100);
    const hoursNeeded = Math.ceil(energyNeeded / chargePower);

    const nyt = new Date();
    const deadline = new Date();
    const [tunnit, minuutit] = targetTime.split(':');
    deadline.setHours(parseInt(tunnit), parseInt(minuutit), 0, 0);
    
    if (deadline <= nyt) {
        deadline.setDate(deadline.getDate() + 1);
    }

    const mahdollisetTunnit = porssiHinnat.filter(p => new Date(p.DateTime) < deadline);

    if (mahdollisetTunnit.length < hoursNeeded) {
        naytaStatus(`Aika ei riitä! Tarvitset ${hoursNeeded}h latausta, mutta aikaa takarajaan on vähemmän.`, "#fff3cd", "#856404");
        return;
    }

    const halvimmatTunnit = [...mahdollisetTunnit]
        .sort((a, b) => a.PriceWithTax - b.PriceWithTax)
        .slice(0, hoursNeeded);

    const energiaPerTunti = energyNeeded / hoursNeeded;
    let kokonaishinta = 0;
    
    halvimmatTunnit.forEach(tunti => {
        kokonaishinta += tunti.PriceWithTax * energiaPerTunti;
    });

    const hintaTeksti = kokonaishinta < 1 ? (kokonaishinta * 100).toFixed(0) + " snt" : kokonaishinta.toFixed(2) + " €";

    const aikajärjestys = [...halvimmatTunnit].sort((a, b) => new Date(a.DateTime) - new Date(b.DateTime));
    
    const tuntiLista = aikajärjestys.map(t => {
        const date = new Date(t.DateTime);
        return date.getHours().toString().padStart(2, '0') + ":00";
    }).join(', ');

    const viesti = `
        <h3 style="margin-top:0; color: #2c3e50;">Lataussuunnitelma ⚡</h3>
        Tarvitaan energiaa: <b>${energyNeeded.toFixed(1)} kWh</b><br>
        Latauksen kesto: <b>n. ${hoursNeeded} tuntia</b><br>
        <br>
        Arvioitu hinta: <b style="color: #2ecc71; font-size: 1.4rem;">${hintaTeksti}</b><br>
        <div style="margin-top: 10px; padding: 10px; background-color: rgba(255,255,255,0.5); border-radius: 8px;">
            <span style="font-size: 0.9rem; color: #444;">Valitut lataustunnit:<br><b>${tuntiLista}</b></span>
        </div>
    `;

    naytaStatus(viesti, "#e8f8f5", "#117a65");

    // TULEVAISUUDEN VALMIUS: Kutsutaan Shelly-funktiota, jos IP on syötetty
    if (shellyIp) {
        ohjelmoiShelly(shellyIp, aikajärjestys);
    }
});

function naytaStatus(teksti, bg, vari) {
    const statusDiv = document.getElementById('status');
    statusDiv.style.display = "block";
    statusDiv.style.backgroundColor = bg;
    statusDiv.style.color = vari;
    statusDiv.innerHTML = teksti;
}

// UUSI FUNKTIO: Sillanrakentaja selaimesi ja älyreleen välille
async function ohjelmoiShelly(ip, valitutTunnit) {
    console.log(`Valmistellaan aikataulua IP-osoitteeseen: ${ip}`);
    
    // Muutetaan valitut tunnit sellaiseen muotoon, jota älyreleet yleensä ymmärtävät
    const aikatauluData = valitutTunnit.map(t => {
        const date = new Date(t.DateTime);
        return `Klo ${date.getHours()}:00 -> VIRTA PÄÄLLE`;
    });

    console.log("Tämä aikataulu lähetettäisiin releen muistiin:", aikatauluData);

    // HUOM: Tämä on kommentoitu pois, jotta selain ei anna virhettä puuttuvasta laitteesta.
    // Kun ostat Shellyn, aktivoimme tämän osion ja muotoilemme 'body'-osan laitteen tarkan ohjekirjan mukaiseksi!
    
    /*
    try {
        const response = await fetch(`http://${ip}/rpc/Schedule.Create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // Shellyn vaatima tarkka JSON-koodi tulee tähän myöhemmin
            })
        });
        
        if (response.ok) {
            console.log("Shelly ohjelmoitu onnistuneesti! Voit sulkea selaimen.");
        }
    } catch (error) {
        console.error("Yhteys Shellyyn epäonnistui. Tarkista IP-osoite ja samassa WiFi-verkossa olo:", error);
    }
    */
}