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


const caleJsonOferte = path.join(__dirname, "Resurse", "Json", "oferte.json");

const T = 2 * 60 * 1000;    
const T2 = 5 * 60 * 1000;   

function genereazaOfertaAutomata() {
    client.query("SELECT unnest(enum_range(NULL::tipuri_produse)) as cat", function (err, rezultat) { // cat - alias pentru unnest, unnest returneaza fiecare element al enum-ului ca un rând separat

        if (err || rezultat.rows.length === 0) {
            console.error("Eroare la extragerea categoriilor pentru generatorul de oferte:", err);
            return;
        }

        const categoriiPosibile = rezultat.rows.map(r => r.cat); 
        const reduceriPosibile = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

        
        let dateJson = { oferte: [] }; 
        if (fs.existsSync(caleJsonOferte)) {
            try {
                dateJson = JSON.parse(fs.readFileSync(caleJsonOferte, "utf-8"));
            } catch (e) {
                console.error("Eroare citire oferte.json:", e);
            }
        }

        // regula: nu se vor genera doua oferte consecutive pentru aceeasi categorie
        let ultimaCategorie = (dateJson.oferte && dateJson.oferte.length > 0) ? dateJson.oferte[0].categorie : null; //  categoria primei oferte 

        let categoriiFiltrate = categoriiPosibile.filter(c => c !== ultimaCategorie); 
        
        
        if (categoriiFiltrate.length === 0) categoriiFiltrate = categoriiPosibile;

        
        
        const categorieAleasa = categoriiFiltrate[Math.floor(Math.random() * categoriiFiltrate.length)];
        const reducereAleasa = reduceriPosibile[Math.floor(Math.random() * reduceriPosibile.length)];

    
        const acum = new Date();
        const momentFinalizare = new Date(acum.getTime() + T);

   
        const nouaOferta = {
            categorie: categorieAleasa,
            "data-incepere": acum.toISOString(),
            "data-finalizare": momentFinalizare.toISOString(),
            reducere: reducereAleasa
        };

        

        // Cerinta T2: Ștergem ofertele expirat de mai mult de T2 minute
        if (dateJson.oferte) {
            dateJson.oferte = dateJson.oferte.filter(oferta => {
                const finalizare = new Date(oferta["data-finalizare"]); // string -> obiect date
                return finalizare > acum || (acum.getTime() - finalizare.getTime() < T2);
            });
        } else {
            dateJson.oferte = [];
        }

        
        dateJson.oferte.unshift(nouaOferta); 

        
        fs.writeFileSync(caleJsonOferte, JSON.stringify(dateJson, null, 4), "utf-8"); 
        console.log(`[OFERTĂ NOUĂ] Categorie: ${categorieAleasa}, Reducere: ${reducereAleasa}%`);
    });
}

// sincronizare a timpului la repornirea serverului
function pornesteSistemOferte() {
    let timpPanaLaExpirare = 0;

    if (fs.existsSync(caleJsonOferte)) {
        try {
            const dateJson = JSON.parse(fs.readFileSync(caleJsonOferte, "utf-8"));
            if (dateJson.oferte && dateJson.oferte.length > 0) {
                const ultimaOferta = dateJson.oferte[0];
                const acum = new Date();
                const finalizare = new Date(ultimaOferta["data-finalizare"]);
                
                // pana expira oferta curenta
                timpPanaLaExpirare = finalizare.getTime() - acum.getTime();
            }
        } catch (e) {
            console.error("Eroare la citirea structurii JSON pentru alinierea timpului:", e);
        }
    }

    
    if (timpPanaLaExpirare <= 0) {
        console.log("[SISTEM OFERTE] Nu există ofertă activă validă în JSON. Se generează una acum...");
        genereazaOfertaAutomata();
        
       
        setTimeout(pornesteSistemOferte, T + 50); 
    } else {
        console.log(`[SISTEM OFERTE] Ofertă activă detectată în fișier. Următoarea se va genera peste ${Math.round(timpPanaLaExpirare / 1000)} secunde.`);
        
        setTimeout(function() { // cu functie callback pentru a păstra contextul și a nu apela imediat
            genereazaOfertaAutomata();
            
            setInterval(genereazaOfertaAutomata, T); 
        }, timpPanaLaExpirare + 50); 
    }
}


setTimeout(pornesteSistemOferte, 1000);


function obtineOfertaActiva() { 
    if (!fs.existsSync(caleJsonOferte)) return null;
    try {
        const dateJson = JSON.parse(fs.readFileSync(caleJsonOferte, "utf-8"));
        if (dateJson.oferte && dateJson.oferte.length > 0) {
            const primaOferta = dateJson.oferte[0];
            const acum = new Date();
            const finalizare = new Date(primaOferta["data-finalizare"]);
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
    let clauzaWhere = ""; 
    if (req.query.tip) {
        clauzaWhere = ` where categorie_mare='${req.query.tip}'`; 
    }

    client.query(`select * from produse ${clauzaWhere}`, function (err, rezProduse) { 
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

                const stats = rezStatistici.rows[0]; // foloseste clauze de agregare => rezultatul este un singur rând cu toate statisticile

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

        const produsCurent = rezProd.rows[0]; 

       
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
                
                return res.render("pagini/produs", { prod: produsCurent, seturi: [] });
            }

            
            if (rezSeturi.rowCount === 0) {
                return res.render("pagini/produs", { prod: produsCurent, seturi: [] });
            }

            
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

        
        console.log("=== DEBUG: Rezultat 'seturi' din DB ===");
        console.log(rezSeturi.rows); 
        console.log(`Au fost găsite ${rezSeturi.rows ? rezSeturi.rows.length : 0} seturi.`);


       // lista unde fiecare rand contine datele unui produs si id ul setului din care face parte

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

        // 

        client.query(sqlProduseSeturi, function (errProd, rezProduse) {
            if (errProd) {
                console.error("--- EROARE SQL PRODUSE SETURI ---", errProd);
                return res.status(500).send("Eroare la produse seturi: " + errProd.message);
            }

            
            console.log("=== DEBUG: Rezultat 'produse din seturi' din DB ===");
            console.log(rezProduse.rows);
            console.log(`Au fost găsite ${rezProduse.rows ? rezProduse.rows.length : 0} asocieri.`);

            // maparea datelor
            try {
                const seturiProcesate = rezSeturi.rows.map(set => {
                    // set este un alias pentru un rand din rezultatul primului query, conține id, nume_set și descriere_set
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