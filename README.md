# SmartCharge – Älykäs Autolaturi

Kandidaatintutkielman toiminnallinen osuus: Selainpohjainen sovellus sähköauton latauksen optimointiin dynaamisilla sähkömarkkinoilla.

---

## Yleiskuvaus

SmartCharge on kevyt ja responsiivinen selainsovellus, joka auttaa sähköautoilijaa hyödyntämään pörssisähkön tuntikohtaisia hintavaihteluita. Sovellus hakee vuorokauden spot-hinnat avoimesta rajapinnasta ja laskee ajoneuvon parametrien sekä käyttäjän asettaman aikatakarajan perusteella kustannustehokkaimmat lataustunnit[cite: 7, 8].

Projekti on toteutettu osana Vaasan yliopiston kandidaatintutkielmaa, jossa tarkastellaan sähköautojen kysyntäjoustoa, hajautettua ohjelmistoarkkitehtuuria sekä energiamarkkinadatan visualisointia.

---

## Keskeiset ominaisuudet

* **Dynaamisen hintadatan nouto:** Hakee kuluvan ja seuraavan vuorokauden arvonlisäverolliset spot-hinnat REST-rajapinnasta (`api.spot-hinta.fi`) JSON-muodossa[cite: 7, 8].
* **Hintadatan visualisointi:** Esittää seuraavan 24 tunnin sähkönhinnat selkeänä linjakuvaajana Chart.js-kirjaston avulla, jolloin hintahuiput ja -pohjat ovat helposti hahmotettavissa[cite: 7, 8].
* **Matemaattinen optimointi:**
  * Laskee akun varaustilan (SoC) ja akkukapasiteetin perusteella tarvittavan energiamäärän (kWh)[cite: 8].
  * Suodattaa pois tunnit, jotka ylittävät käyttäjän määrittämän valmistumisajan[cite: 8].
  * Valitsee vaadittavan tuntimäärän mukaisesti vuorokauden halvimmat lataustunnit ja laskee lataustapahtuman kokonaishinnan[cite: 8].
* **Käyttökokemus ja pysyvyys:** Tallentaa syötetyt parametrit selaimen paikallismuistiin (`LocalStorage`), jolloin toistuva tietojen syöttäminen minimoituu[cite: 8].
* **Valmius laiteohjaukseen:** Sisältää arkkitehtuurisen valmiuden ja syöttökentän Shelly-älyreleelle, mikä mahdollistaa ohjelmiston laajentamisen fyysiseen latausvirran kytkentään[cite: 7, 8].

---

## Teknologiat ja arkkitehtuuri

Sovellus toimii puhtaasti asiakaspäässä (client-side) ilman raskasta palvelininfrastruktuuria[cite: 7, 8]:

* **HTML5:** Sovelluksen semanttinen rakenne ja syöttökentät.
* **CSS3:** Moderni, korttipohjainen ja responsiivinen asettelu Flexbox-tekniikalla[cite: 6].
* **JavaScript (ES6):** Asynkroninen tiedonhaku (`fetch`), optimointialgoritmi, datan esikäsittely ja DOM-manipulaatio[cite: 8].
* **Chart.js:** Responsiivinen JavaScript-kirjasto tietojen visualisointiin HTML5 `canvas` -elementissä[cite: 7, 8].
* **LocalStorage API:** Selaimen sisäinen avain-arvovarasto käyttäjäparametrien tallentamiseen[cite: 8].

---

## Käyttöönotto

Sovellus ei vaadi erillistä asennusta, kääntämistä tai taustapalvelinta[cite: 7, 8].

1. Kloonaa repositorio omalle koneellesi:
   ```bash
   git clone [https://github.com/kayttajanimesi/autolaturi.git](https://github.com/kayttajanimesi/autolaturi.git)
