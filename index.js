const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass");
const sharp = require("sharp");
const pg = require("pg");

const app = express();
app.set("view engine", "ejs");

const obGlobal = {
    obErori: null,
    obImagini: null,
    folderScss: path.join(__dirname, "Resurse/Scss"),
    folderCss: path.join(__dirname, "Resurse/Css"),
    folderBackup: path.join(__dirname, "backup"),
};

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

const client = new pg.Client({
    database: "proiect_beauty_hub",
    user: "beauty_hub_admin",
    password: "beauty_hub",
    host: "localhost",
    port: 5432
});

client.connect();

// bonus 12: sistem automat de oferte 

// calea către oferte.json
const caleJsonOferte = path.join(__dirname, "Resurse", "Json", "oferte.json");

// sistem automat de oferte 
const T = 2 * 60 * 1000;    // Interval T: 2 minute (pentru prezentare / bonus)
const T2 = 5 * 60 * 1000;   // Interval T2: 5 minute (vechimea maximă a ofertelor expirate)

function genereazaOfertaAutomata() {
    // Extragem din DB categoriile disponibile din enum-ul folosit în meniu
    client.query("SELECT unnest(enum_range(NULL::tipuri_produse)) as cat", function (err, rezultat) { // cat - alias pentru unnest, unnest returnează fiecare element al enum-ului ca un rând separat
        if (err || rezultat.rows.length === 0) {
            console.error("Eroare la extragerea categoriilor pentru generatorul de oferte:", err);
            return;
        }

        const categoriiPosibile = rezultat.rows.map(r => r.cat); // extragem doar valorile din cat  într-un array simplu de stringuri, rezultat.rows vector de obiecte {cat: "valoare_enum"}, mapăm doar valoarea enum-ului
        const reduceriPosibile = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

        // Citim JSON-ul curent
        let dateJson = { oferte: [] }; // daca nu exista plecam de la ob gol
        if (fs.existsSync(caleJsonOferte)) {
            try {
                dateJson = JSON.parse(fs.readFileSync(caleJsonOferte, "utf-8"));
            } catch (e) {
                console.error("Eroare citire oferte.json:", e);
            }
        }

        // regula: nu se vor genera doua oferte consecutive pentru aceeasi categorie
        let ultimaCategorie = (dateJson.oferte && dateJson.oferte.length > 0) ? dateJson.oferte[0].categorie : null; // verificăm dacă există oferte și luăm categoria primei oferte (cea mai recentă), altfel null

        let categoriiFiltrate = categoriiPosibile.filter(c => c !== ultimaCategorie); // `.filter()` creează un vector nou eliminând categoria care tocmai a fost folosită tura trecută
        
        // siguranța: Daca avem o singura categorie în total, vectorul filtrat ar fi gol. revenim la cel complet.
        if (categoriiFiltrate.length === 0) categoriiFiltrate = categoriiPosibile;

        // Alegem aleator o categorie și o reducere
        // Alegerea aleatorie se face pe baza lungimii vectorului filtrat, înmulțită cu un număr zecimal aleator între 0 și 1, apoi rotunjită în jos pentru a obține un index valid, rotunjim in jos pentru a nu depăși indexul maxim (index pleaca de la 0, deci lungime 5 are indexi 0-4)
        const categorieAleasa = categoriiFiltrate[Math.floor(Math.random() * categoriiFiltrate.length)];
        const reducereAleasa = reduceriPosibile[Math.floor(Math.random() * reduceriPosibile.length)];

    // Timpul curent și calcularea expirării prin adunarea constantă a celor T milisecunde (2 minute)
        const acum = new Date();
        const momentFinalizare = new Date(acum.getTime() + T);

    // Construim structura noii oferte (proprietățile cu cratimă sunt obligatoriu string-uri)
        const nouaOferta = {
            categorie: categorieAleasa,
            "data-incepere": acum.toISOString(),
            "data-finalizare": momentFinalizare.toISOString(),
            reducere: reducereAleasa
        };

        // curatarea istoricului ofertelor expirate: păstrăm doar ofertele care sunt încă active sau cele expirate în ultimele T2 milisecunde (5 minute)

        // Cerința T2: Ștergem ofertele expirat de mai mult de T2 minute
        if (dateJson.oferte) {
            dateJson.oferte = dateJson.oferte.filter(oferta => {
                const finalizare = new Date(oferta["data-finalizare"]); // transformăm stringul în obiect Date pentru comparații, din cauza cratimei nu putem scrie oferta.data-finalizare, ci oferta["data-finalizare"]
                // Păstrăm oferta dacă: este încă activă SAU (dacă e expirată, nu a trecut mai mult de T2 de la finalizarea ei)
                return finalizare > acum || (acum.getTime() - finalizare.getTime() < T2);
            });
        } else {
            dateJson.oferte = [];
        }

        // Introducem noua ofertă la începutul vectorului (va fi mereu prima)
        dateJson.oferte.unshift(nouaOferta); // unshift adaugă elementul la începutul vectorului, spre deosebire de push care îl adaugă la sfârșit

        // Salvăm în fișier
        fs.writeFileSync(caleJsonOferte, JSON.stringify(dateJson, null, 4), "utf-8"); // null și 4 sunt pentru a formata frumos JSON-ul în fișier, cu indentare de 4 spații
        console.log(`[OFERTĂ NOUĂ] Categorie: ${categorieAleasa}, Reducere: ${reducereAleasa}%`);
    });
}

// mecanismul de sincronizare a timpului la repornirea serverului
function pornesteSistemOferte() {
    let timpPanaLaExpirare = 0;

    if (fs.existsSync(caleJsonOferte)) {
        try {
            const dateJson = JSON.parse(fs.readFileSync(caleJsonOferte, "utf-8"));
            if (dateJson.oferte && dateJson.oferte.length > 0) {
                const ultimaOferta = dateJson.oferte[0];
                const acum = new Date();
                const finalizare = new Date(ultimaOferta["data-finalizare"]);
                
                // Calculăm câte milisecunde mai sunt până expiră oferta curentă din fișier
                timpPanaLaExpirare = finalizare.getTime() - acum.getTime();
            }
        } catch (e) {
            console.error("Eroare la citirea structurii JSON pentru alinierea timpului:", e);
        }
    }

    // Dacă ultima ofertă e deja expirată (sau nu există deloc), generăm una pe loc
    if (timpPanaLaExpirare <= 0) {
        console.log("[SISTEM OFERTE] Nu există ofertă activă validă în JSON. Se generează una acum...");
        genereazaOfertaAutomata();
        
        // Deoarece funcția tocmai a generat o ofertă valabilă timp de T,
        // următoarea verificare se va face direct peste un interval de lungime T (+ marjă de siguranță)
        setTimeout(pornesteSistemOferte, T + 50); // Cei 50ms asigură că timestamp-ul curent a depășit complet momentul finalizării vechi, evitând orice risc de sincronizare perfectă care ar putea duce la generarea imediată a unei noi oferte
    } else {
        // Dacă serverul a fost repornit și oferta anterioară e încă activă în fișier,
        // așteptăm perfect până la expirarea ei înainte de a genera următoarea ofertă
        console.log(`[SISTEM OFERTE] Ofertă activă detectată în fișier. Următoarea se va genera peste ${Math.round(timpPanaLaExpirare / 1000)} secunde.`);
        
        setTimeout(function() { // cu functie callback pentru a păstra contextul și a nu apela imediat
            genereazaOfertaAutomata();
            // Continuăm ciclul din 2 în 2 minute
            setInterval(genereazaOfertaAutomata, T); // După ce prima ofertă a expirat și am generat una nouă, următoarele se vor genera la intervale regulate de T milisecunde
        }, timpPanaLaExpirare + 50); // Cei 50ms asigură că timestamp-ul curent a depășit complet momentul finalizării vechi
    }
}

// Inițializăm sistemul la 1 secundă după conectarea bazei de date
setTimeout(pornesteSistemOferte, 1000);

// Funcție utilitară pentru a citi oferta activă curentă
function obtineOfertaActiva() { // pentru a fi transmise informațiile ofertei active către paginile EJS, astfel încât temporizatorul să știe ce dată de finalizare să afișeze și să se sincronizeze corect
    if (!fs.existsSync(caleJsonOferte)) return null;
    try {
        const dateJson = JSON.parse(fs.readFileSync(caleJsonOferte, "utf-8"));
        if (dateJson.oferte && dateJson.oferte.length > 0) {
            const primaOferta = dateJson.oferte[0];
            const acum = new Date();
            const finalizare = new Date(primaOferta["data-finalizare"]);
            // Verificăm dacă este încă în intervalul de valabilitate
            if (acum < finalizare) {
                return primaOferta;
            }
        }
    } catch (e) {
        console.error("Eroare la citirea ofertei active:", e);
    }
    return null;
}






client.query("select * from produse where id>3", function (err, rez) {
    if (err) {
        console.log("Eroare query", err);
    } else {
        console.log(rez);
    }
});

let vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(path.join(caleFolder), { recursive: true });
    }
}

app.use("/Resurse", express.static(path.join(__dirname, "Resurse")));
app.use("/dist", express.static(path.join(__dirname, "/node_modules/bootstrap/dist")));

app.use(function (req, res, next) {
    client.query(`
        SELECT unnest(enum_range(NULL::tipuri_produse))
    `, function (err, rezultat) {
        if (err) {
            console.error("Eroare la extragerea categoriilor pentru meniu:", err);
            res.locals.categoriiMeniu = [];
        } else {
            res.locals.categoriiMeniu = rezultat.rows;
        }
        next();
    });
});

app.get(["/", "/index", "/home"], function (req, res) {
    // Trimitem oferta activă pe pagina principală
    res.render("pagini/index", {
        ip: req.ip,
        imagini: obGlobal.obImagini,
        ofertaActiva: obtineOfertaActiva()
    });
});

app.get("/galerie", function (req, res) {
    res.render("pagini/galerie", {
        imagini: obGlobal.obImagini
    });
});

// generare pagina produse

app.get("/produse", function (req, res) {
    let clauzaWhere = ""; // Dacă există un filtru de tip în query string, adăugăm o clauză WHERE pentru a filtra produsele după categoria mare
    if (req.query.tip) {
        clauzaWhere = ` where categorie_mare='${req.query.tip}'`; // verifica daca utilizatorul a trimis un parametru de tip în query string - filtrare un url (ex: /produse?tip=parfumuri), dacă da, construim o clauză WHERE pentru a filtra produsele după categoria mare, folosind valoarea trimisă de utilizator
    }

    client.query(`select * from produse ${clauzaWhere}`, function (err, rezProduse) { // client.query se executa asincron, deci tot ce ține de prelucrarea rezultatului trebuie să fie în callback-ul funcției, altfel am avea probleme de sincronizare și am încerca să prelucrăm rezultatul înainte să fie disponibil
        if (err) {
            console.log("Eroare produse", err);
            afisareEroare(res, 2);
            return;
        }

        // bonus 1: date dinamice provenite din baza de date pentru fiecare tip de input

        const sqlStatistici = `
            SELECT 
                MIN(pret) AS pret_minim, 
                MAX(pret) AS pret_maxim, 
                MIN(cantitate_ml_g) AS gramaj_minim, 
                MAX(cantitate_ml_g) AS gramaj_maxim,
                ARRAY_AGG(DISTINCT brand ORDER BY brand) AS lista_branduri,
                (SELECT COUNT(*) FROM unnest(enum_range(null::categorii_gama))) AS numar_optiuni_enum,
                (SELECT character_maximum_length FROM information_schema.columns 
                 WHERE table_name = 'produse' AND column_name = 'nume') AS lungime_max_nume
            FROM produse;
        `;

        // MIN(pret) AS pret_minim, MAX(pret) AS pret_maxim : input range
        // MIN(cantitate_ml_g) AS gramaj_minim, MAX(cantitate_ml_g) AS gramaj_maxim: input radio buttons
        // ARRAY_AGG(DISTINCT brand ORDER BY brand) AS lista_branduri: input datalist
        // in textare preluam dinamic numarul total de produse din baza de date

        client.query(sqlStatistici, function (err, rezStatistici) {
            if (err) {
                console.log("Eroare statistici", err);
                afisareEroare(res, 2);
                return;
            }

            client.query("select * from unnest(enum_range(null::categorii_gama))", function (err, rezOptiuni) {
                if (err) {
                    console.log("Eroare opțiuni enum", err);
                    afisareEroare(res, 2);
                    return;
                }

                const stats = rezStatistici.rows[0]; // foloseste clauze de agregare => rezultatul este un singur rând cu toate statisticile, deci îl preluăm direct ca obiect din primul element al vectorului de rânduri

                res.render("pagini/produse", {
                    produse: rezProduse.rows,
                    optiuni: rezOptiuni.rows, 
                    pretMinim: Math.floor(stats.pret_minim || 0),
                    pretMaxim: Math.ceil(stats.pret_maxim || 100),
                    gramajMinim: stats.gramaj_minim || 0,
                    gramajMaxim: stats.gramaj_maxim || 1000,
                    branduri: stats.lista_branduri || [],
                    lungimeMaxNume: stats.lungime_max_nume || 100,
                    numarOptiuniEnum: stats.numar_optiuni_enum || 3,
                    totalProduseCurent: rezProduse.rowCount,
                    // Trimitem oferta activă și pe pagina de produse ca să putem tăia prețurile
                    ofertaActiva: obtineOfertaActiva() 
                });
            });
        });
    });
});

// app.get("/produs/:id", function (req, res) {
//     client.query(`select * from produse where id=${req.params.id}`, function (err, rez) {
//         if (err) {
//             console.log("Eroare", err);
//             afisareEroare(res, 2);
//         } else {
//             if (rez.rowCount == 0) {
//                 afisareEroare(res, 404, "Produs inexistent");
//             } else {
//                 res.render("pagini/produs", {
//                     prod: rez.rows[0]
//                 });
//             }
//         }
//     });
// });


app.get("/produs/:id", function (req, res) { // id este un parametru dinamic
    const idProdus = req.params.id;

    // 1. Luăm mai întâi datele produsului curent
    client.query(`SELECT * FROM produse WHERE id=${idProdus}`, function (err, rezProd) {
        if (err) {
            console.error("Eroare la citirea produsului:", err);
            afisareEroare(res, 2);
            return;
        }

        if (rezProd.rowCount == 0) {
            afisareEroare(res, 404, "Produs inexistent");
            return;
        }

        const produsCurent = rezProd.rows[0]; // un singur produs in tabel

        // 2. Luăm seturile din care face parte acest produs
        const sqlSeturiProdus = `
            SELECT s.id, s.nume_set, s.descriere_set 
            FROM seturi s
            JOIN asociere_set asoc ON s.id = asoc.id_set
            WHERE asoc.id_produs = ${idProdus}
            ORDER BY s.id;
        `;

        client.query(sqlSeturiProdus, function (errSeturi, rezSeturi) {
            if (errSeturi) {
                console.error("Eroare la citirea seturilor produsului:", errSeturi);
                // Chiar dacă dă eroare la seturi, randăm pagina doar cu produsul ca să nu crăpăm tot site-ul
                return res.render("pagini/produs", { prod: produsCurent, seturi: [] });
            }

            // Dacă produsul nu face parte din niciun set, randăm direct
            if (rezSeturi.rowCount === 0) {
                return res.render("pagini/produs", { prod: produsCurent, seturi: [] });
            }

            // 3. Pentru a calcula prețul fiecărui set, avem nevoie de TOATE produsele din acele seturi
            const listeIdSeturi = rezSeturi.rows.map(s => s.id).join(",");
            const sqlToateProduseleDinSeturi = `
                SELECT asoc.id_set, p.id, p.nume, p.imagine, p.pret
                FROM asociere_set asoc
                JOIN produse p ON asoc.id_produs = p.id
                WHERE asoc.id_set IN (${listeIdSeturi});
            `;

            client.query(sqlToateProduseleDinSeturi, function (errToateProd, rezToateProd) {
                if (errToateProd) {
                    console.error("Eroare la citirea tuturor produselor din seturi:", errToateProd);
                    return res.render("pagini/produs", { prod: produsCurent, seturi: [] });
                }

                // 4. Aplicăm aceeași logică de calcul de la pagina /seturi
                const seturiProcesate = rezSeturi.rows.map(set => {
                    const produseDinSet = rezToateProd.rows.filter(p => p.id_set === set.id);
                    const n = produseDinSet.length;
                    const procentReducere = Math.min(5, n) * 0.05;
                    
                    const pretIntreg = produseDinSet.reduce((sum, p) => sum + parseFloat(p.pret || 0), 0);
                    const pretCalculatSet = pretIntreg * (1 - procentReducere);

                    return {
                        id: set.id,
                        nume_set: set.nume_set,
                        descriere_set: set.descriere_set,
                        produse: produseDinSet,
                        pret_final: pretCalculatSet.toFixed(2)
                    };
                });

                // Trimitem datele către EJS
                res.render("pagini/produs", {
                    prod: produsCurent,
                    seturi: seturiProcesate
                });
            });
        });
    });
});

app.get("/seturi", function (req, res) {
    console.log("=== DEBUG: Ruta /seturi a fost apelată ===");

    const sqlSeturi = `SELECT id, nume_set, descriere_set FROM seturi ORDER BY id;`;

    client.query(sqlSeturi, function (err, rezSeturi) {
        if (err) {
            console.error("--- EROARE SQL SETURI ---", err);
            return res.status(500).send("Eroare la seturi: " + err.message);
        }

        // AICI AFIȘĂM REZULTATUL PRIMULUI QUERY
        console.log("=== DEBUG: Rezultat 'seturi' din DB ===");
        console.log(rezSeturi.rows); 
        console.log(`Au fost găsite ${rezSeturi.rows ? rezSeturi.rows.length : 0} seturi.`);

        const sqlProduseSeturi = `
            SELECT 
                asoc.id_set, 
                p.id, 
                p.nume, 
                p.imagine, 
                p.pret
            FROM asociere_set asoc
            JOIN produse p ON asoc.id_produs = p.id;
        `;

        client.query(sqlProduseSeturi, function (errProd, rezProduse) {
            if (errProd) {
                console.error("--- EROARE SQL PRODUSE SETURI ---", errProd);
                return res.status(500).send("Eroare la produse seturi: " + errProd.message);
            }

            // AICI AFIȘĂM REZULTATUL CELUI DE-AL DOILEA QUERY
            console.log("=== DEBUG: Rezultat 'produse din seturi' din DB ===");
            console.log(rezProduse.rows);
            console.log(`Au fost găsite ${rezProduse.rows ? rezProduse.rows.length : 0} asocieri.`);

            // Executăm maparea datelor
            try {
                const seturiProcesate = rezSeturi.rows.map(set => {
                    const produseDinSet = rezProduse.rows.filter(p => p.id_set === set.id);
                    const n = produseDinSet.length;
                    const procentReducere = Math.min(5, n) * 0.05;
                    
                    const pretIntreg = produseDinSet.reduce((sum, p) => sum + parseFloat(p.pret || 0), 0);
                    const pretCalculatSet = pretIntreg * (1 - procentReducere);

                    return {
                        id: set.id,
                        nume_set: set.nume_set,
                        descriere_set: set.descriere_set,
                        numar_produse: n,
                        produse: produseDinSet,
                        pret_vechi: pretIntreg.toFixed(2),
                        pret_final: pretCalculatSet.toFixed(2)
                    };
                });

                console.log("=== DEBUG: Datele au fost procesate cu succes în JS. Se randează EJS... ===");
                
                res.render("pagini/seturi", {
                    seturi: seturiProcesate
                });

            } catch (eroareJS) {
                console.error("--- EROARE ÎN LOGICA JAVASCRIPT (MAP/REDUCE) ---", eroareJS);
                return res.status(500).send("Eroare de procesare JS: " + eroareJS.message);
            }
        });
    });
});

function initErori() {
    let continut = fs.readFileSync(path.join(__dirname, "Resurse/Json/erori.json")).toString("utf-8");
    let erori = obGlobal.obErori = JSON.parse(continut);
    let err_default = erori.eroare_default;
    err_default.imagine = path.join(erori.cale_baza, err_default.imagine);
    for (let eroare of erori.info_erori) {
        eroare.imagine = path.join(erori.cale_baza, eroare.imagine);
    }
}
initErori();

function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroare = obGlobal.obErori.info_erori.find((elem) => elem.identificator == identificator);
    let errDefault = obGlobal.obErori.eroare_default;
    if (eroare?.status) res.status(eroare.identificator);
    res.render("pagini/eroare", {
        imagine: imagine || eroare?.imagine || errDefault.imagine,
        titlu: titlu || eroare?.titlu || errDefault.titlu,
        text: text || eroare?.text || errDefault.text
    });
}

app.get("/eroare", function (req, res) {
    afisareEroare(res, 404, "Titlu!!!");
});

function initImagini() {
    var continut = fs.readFileSync(path.join(__dirname, "Resurse/Json/galerie.json")).toString("utf-8");
    var obJSON = JSON.parse(continut);
    let vImagini = obJSON.imagini;
    let caleGalerie = obJSON.cale_galerie;

    const luniAn = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
    const lunaCurenta = luniAn[new Date().getMonth()];

    let imaginiFiltrate = vImagini
        .filter(img => img.luni.includes(lunaCurenta))
        .slice(0, 12);

    let caleAbs = path.join(__dirname, caleGalerie);
    let caleAbsMic = path.join(caleAbs, "mic");
    let caleAbsMediu = path.join(caleAbs, "mediu");

    if (!fs.existsSync(caleAbsMic)) fs.mkdirSync(caleAbsMic, { recursive: true });
    if (!fs.existsSync(caleAbsMediu)) fs.mkdirSync(caleAbsMediu, { recursive: true });

    imaginiFiltrate.forEach(img => {
        let numeFis = path.parse(img.fisier).name;
        let caleFisSursa = path.join(caleAbs, img.fisier);

        sharp(caleFisSursa).resize(200).toFile(path.join(caleAbsMic, numeFis + ".webp"));
        sharp(caleFisSursa).resize(400).toFile(path.join(caleAbsMediu, numeFis + ".webp"));

        img.cale_fisier = path.join("/", caleGalerie, img.fisier);
        img.cale_mic = path.join("/", caleGalerie, "mic", numeFis + ".webp");
        img.cale_mediu = path.join("/", caleGalerie, "mediu", numeFis + ".webp");
    });

    obGlobal.obImagini = imaginiFiltrate;
}
initImagini();

function compileazaScss(caleScss, caleCss) {
    if (!caleCss) {
        let numeFisExt = path.basename(caleScss);
        let numeFis = numeFisExt.split(".")[0];
        caleCss = numeFis + ".css";
    }

    if (!path.isAbsolute(caleScss)) caleScss = path.join(obGlobal.folderScss, caleScss);
    if (!path.isAbsolute(caleCss)) caleCss = path.join(obGlobal.folderCss, caleCss);

    let caleBackup = path.join(obGlobal.folderBackup, "Resurse/Css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, { recursive: true });
    }

    let numeFisCss = path.basename(caleCss);
    let caleDestinatieBackup = path.join(caleBackup, numeFisCss);

    if (fs.existsSync(caleCss)) {
        try {
            fs.copyFileSync(caleCss, caleDestinatieBackup);
        } catch (e) {
            console.error(`[EROARE BACKUP] Nu s-a putut copia ${numeFisCss}:`, e);
        }
    }

    try {
        const rez = sass.compile(caleScss, { "sourceMap": true });
        fs.writeFileSync(caleCss, rez.css);
        console.log(`[SCSS] Compilat: ${path.basename(caleScss)} -> ${numeFisCss}`);
    } catch (err) {
        console.error(`[EROARE COMPILARE] SASS eroare la ${caleScss}:`, err);
    }
}

const vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere) {
    if (path.extname(numeFis) == ".scss") {
        compileazaScss(numeFis);
    }
}

fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
    if (eveniment == "change" || eveniment == "rename") {
        let caleCompletaScss = path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompletaScss) && path.extname(numeFis) == ".scss") {
            let numeFisCss = numeFis.replace(".scss", ".css");
            compileazaScss(numeFis, numeFisCss);
        }
    }
});

app.get("/favicon.ico", function (req, res) {
    res.sendFile(path.join(__dirname, "Resurse/Imagini/favicon/favicon.ico"));
});

app.get("/*pagina", function (req, res) {
    if (req.url.startsWith("/Resurse") && path.extname(req.url) == "") {
        afisareEroare(res, 403);
        return;
    }
    if (path.extname(req.url) == ".ejs") {
        afisareEroare(res, 400);
        return;
    }
    try {
        res.render("pagini" + req.url, function (err, rezRandare) {
            if (err) {
                if (err.message.includes("Failed to lookup view")) {
                    afisareEroare(res, 404);
                } else {
                    afisareEroare(res);
                }
            } else {
                res.send(rezRandare);
            }
        });
    } catch (err) {
        if (err.message.includes("Cannot find module")) {
            afisareEroare(res, 404);
        } else {
            afisareEroare(res);
        }
    }
});

app.listen(8080);
console.log("Serverul a pornit pe portul 8080!");