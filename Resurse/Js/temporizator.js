document.addEventListener("DOMContentLoaded", () => {
    const banner = document.getElementById("banner-oferta");
    const temporizator = document.getElementById("temporizator-oferta");

    if (!banner || !temporizator) return;

    // Preluăm data de finalizare salvată în atributul HTML din EJS
    // Citește valoarea atributului custom "data-finalizare" pus de serverul EJS pe banner (un string cu o dată, ex: "2026-06-05 18:00:00"). o convertește într-un obiect de tip dată și apoi, prin .getTime(), o transformă într-un număr uriaș ce reprezintă milisecundele scurse din anul 1970 până la acea dată țintă
    const dataFinalizareTinta = new Date(banner.getAttribute("data-finalizare")).getTime();

    const intervalCronometru = setInterval(() => { // cronometru asincron
        const acum = new Date().getTime();
        const diferentaTimp = dataFinalizareTinta - acum;

        // Dacă oferta a expirat
        if (diferentaTimp <= 0) {
            clearInterval(intervalCronometru);
            temporizator.textContent = "00:00:00";
            temporizator.classList.remove("temporizator-critic");
            // Reîncărcăm pagina ca să fie adusă din server noua ofertă generată automat
            window.location.reload();
            return;
        }

        // Calculăm orele, minutele și secundele rămase
        const ore = Math.floor((diferentaTimp % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minute = Math.floor((diferentaTimp % (1000 * 60 * 60)) / (1000 * 60));
        const secunde = Math.floor((diferentaTimp % (1000 * 60)) / 1000);

        // Formatăm textul cu zero în față dacă cifrele sunt < 10 (ex: 05:09:02)
        const formatOre = ore < 10 ? "0" + ore : ore;
        const formatMinute = minute < 10 ? "0" + minute : minute;
        const formatSecunde = secunde < 10 ? "0" + secunde : secunde;

        temporizator.textContent = `${formatOre}:${formatMinute}:${formatSecunde}`;

        // Marcăm în mod diferit ultimele 10 secunde (Cerința 0.3)
        // Schimbat din "ultimele-secunde" în "temporizator-critic" pentru a se potrivi cu fișierul CSS
        if (diferentaTimp <= 10000) { // adauga clasa css pe element
            temporizator.classList.add("temporizator-critic");
        } else {
            temporizator.classList.remove("temporizator-critic");
        }

    }, 1000);
});