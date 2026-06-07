document.addEventListener("DOMContentLoaded", () => {
    const banner = document.getElementById("banner-oferta");
    const temporizator = document.getElementById("temporizator-oferta");

    if (!banner || !temporizator) return;

    // luam  data de finalizare salvata in atributul HTML din EJS
    
    const dataFinalizareTinta = new Date(banner.getAttribute("data-finalizare")).getTime();

    const intervalCronometru = setInterval(() => { // cronometru asincron
        const acum = new Date().getTime();
        const diferentaTimp = dataFinalizareTinta - acum;

        
        if (diferentaTimp <= 0) {
            clearInterval(intervalCronometru);
            temporizator.textContent = "00:00:00";
            temporizator.classList.remove("temporizator-critic");
            // server noua oferta generata automat
            window.location.reload();
            return;
        }

       // ore .. ramase
        const ore = Math.floor((diferentaTimp % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minute = Math.floor((diferentaTimp % (1000 * 60 * 60)) / (1000 * 60));
        const secunde = Math.floor((diferentaTimp % (1000 * 60)) / 1000);

        // textul cu zero in fata
        const formatOre = ore < 10 ? "0" + ore : ore;
        const formatMinute = minute < 10 ? "0" + minute : minute;
        const formatSecunde = secunde < 10 ? "0" + secunde : secunde;

        temporizator.textContent = `${formatOre}:${formatMinute}:${formatSecunde}`;

        // ultimele sec
        if (diferentaTimp <= 10000) { // adauga clasa css pe element
            temporizator.classList.add("temporizator-critic");
        } else {
            temporizator.classList.remove("temporizator-critic");
        }

    }, 1000);
});