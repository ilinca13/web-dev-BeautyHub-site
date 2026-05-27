const express= require("express");
const path= require("path");
const fs= require("fs");
const sass= require("sass");
const sharp= require("sharp");

const pg= require("pg");

app= express();
app.set("view engine", "ejs") 

obGlobal={
    obErori:null,
    obImagini:null,
    folderScss: path.join(__dirname,"Resurse/Scss"),
    folderCss: path.join(__dirname,"Resurse/Css"),
    folderBackup: path.join(__dirname,"backup"),
}

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

// client=new pg.Client({
//     database:"proiect_tw",
//     user:"beauty_hub_admin",
//     password:"beauty_hub",
//     host:"localhost",
//     port:5432
// })

client = new pg.Client({
    database: "proiect_beauty_hub",
    user: "beauty_hub_admin",
    password: "beauty_hub",
    host: "localhost",
    port: 5432
});

client.connect()

client.query("select * from produse where id>3", function (err, rez){
   if (err) {
       console.log("Eroare query", err)
   }
    else{
        console.log(rez)
    }
})

let vect_foldere=[ "temp", "logs", "backup", "fisiere_uploadate" ] 
for (let folder of vect_foldere){
    let caleFolder=path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(path.join(caleFolder), {recursive:true});  // recusrive permite si subfoldere 
    }
}

app.use("/Resurse", express.static(path.join(__dirname, "Resurse")));
app.use("/dist", express.static(path.join(__dirname, "/node_modules/bootstrap/dist")));



app.use(function (req, res, next) {
    client.query(`
        SELECT unnest(enum_range(NULL::tipuri_produse))
    `, function(err, rezultat) {
        if (err) {
            console.error("Eroare la extragerea categoriilor pentru meniu:", err);
            res.locals.categoriiMeniu = []; // locals este un obiect disponibil in toate rutele, putem adauga proprietati care sa fie accesibile in toate rutele
        } else {
            res.locals.categoriiMeniu = rezultat.rows; 
        }
        next(); // next trebuie apelat pentru a continua procesarea cererii, trece la urmatoarea functie care se potriveste cu cererea
    });
});

app.get(["/", "/index", "/home"], function(req, res){
    //res.sendFile(path.join(__dirname, "index.html"));
    res.render("pagini/index", {
        ip: req.ip,
        imagini: obGlobal.obImagini
    });
});

app.get("/galerie", function(req, res){
    res.render("pagini/galerie", {
        imagini: obGlobal.obImagini 
    });
});

// app.get("/despre", function(req, res){
    // res.render("pagini/despre");
// });

app.get("/produse", function(req, res){
    let clauzaWhere="";
    if(req.query.tip){
        clauzaWhere=` where categorie_mare='${req.query.tip}'`
    }
   client.query(`select * from produse ${clauzaWhere}`, function (err, rez){
   if (err) {
       console.log("Eroare", err)
       afisareEroare(res, 2)
   }
    else{
        client.query("select * from unnest(enum_range(null::categorii_gama))", function(err, rezOptiuni){
                if (err){
                    afisareEroare(res, 2)
                }
                else{
                    res.render("pagini/produse", {
                        produse: rez.rows,
                        optiuni: rezOptiuni.rows // vectorul de inregistrari date de select (vector de obiecte), fiecare inregistrare are proprietatea "unnest" care contine o valoare din enum
                    })
                }
            })
        
    }
})
});

app.get("/produs/:id", function(req, res){
    
   client.query(`select * from produse where id=${req.params.id}`, function (err, rez){
   if (err) {
       console.log("Eroare", err)
       afisareEroare(res, 2)
   }
    else{
        if (rez.rowCount==0){
            afisareEroare(res, 404, "Produs inexistent")}
        else
        {
             res.render("pagini/produs", {
                prod: rez.rows[0]
            })
        }
       
    }
})
});

function initErori(){
    let continut = fs.readFileSync(path.join(__dirname,"Resurse/Json/erori.json")).toString("utf-8"); 
    let erori=obGlobal.obErori=JSON.parse(continut) 
    let err_default=erori.eroare_default
    err_default.imagine=path.join(erori.cale_baza, err_default.imagine) 
    for (let eroare of erori.info_erori){ 
        eroare.imagine=path.join(erori.cale_baza, eroare.imagine)
    }

}
initErori()

function afisareEroare(res, identificator, titlu, text, imagine){// cele care nu sunt setate vor fi undefined evaluate ca false
    let eroare=obGlobal.obErori.info_erori.find((elem)=> 
        elem.identificator==identificator) 
    let errDefault=obGlobal.obErori.eroare_default;
    if(eroare?.status) // daca eroare nu este undefined si are proprietatea status
        res.status(eroare.identificator);
    res.render("pagini/eroare", {
        imagine: imagine || eroare?.imagine || errDefault.imagine,
        titlu: titlu || eroare?.titlu || errDefault.titlu, 
        text: text || eroare?.text || errDefault.text});

}

app.get("/eroare", function(req, res){
    afisareEroare(res, 404, "Titlu!!!")
});

// function initImagini(){
//     var continut= fs.readFileSync(path.join(__dirname,"Resurse/Json/galerie.json")).toString("utf-8");

//     obGlobal.obImagini=JSON.parse(continut);
//     let vImagini=obGlobal.obImagini.imagini;
//     let caleGalerie=obGlobal.obImagini.cale_galerie

//     let caleAbs=path.join(__dirname,caleGalerie);
//     let caleAbsMediu=path.join(caleAbs, "mediu");
//     if (!fs.existsSync(caleAbsMediu))
//         fs.mkdirSync(caleAbsMediu);
    
//     for (let imag of vImagini){
//         [numeFis, ext]=imag.fisier.split("."); //"ceva.png" -> ["ceva", "png"]
//         let caleFisAbs=path.join(caleAbs,imag.fisier);
//         let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
//         sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
//         imag.fisier_mediu=path.join("/", caleGalerie, "mediu", numeFis+".webp" )
//         imag.fisier=path.join("/", caleGalerie, imag.fisier )
        
//     }
//     // console.log(obGlobal.obImagini)
// }

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
        let numeFis = path.parse(img.fisier).name; // scoate extensia
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

// function compileazaScss(caleScss, caleCss){
//     if(!caleCss){

//         let numeFisExt=path.basename(caleScss); // "folder1/folder2/a.scss" -> "a.scss"
//         let numeFis=numeFisExt.split(".")[0]   /// "a.scss"  -> ["a","scss"]
//         caleCss=numeFis+".css"; // output: a.css
//     }
    
//     if (!path.isAbsolute(caleScss))
//         caleScss=path.join(obGlobal.folderScss,caleScss )
//     if (!path.isAbsolute(caleCss))
//         caleCss=path.join(obGlobal.folderCss,caleCss )
    
//     let caleBackup=path.join(obGlobal.folderBackup, "Resurse/Css");
//     if (!fs.existsSync(caleBackup)) {
//         fs.mkdirSync(caleBackup,{recursive:true})
//     }
    
//     // la acest punct avem cai absolute in caleScss si  caleCss

//     let numeFisCss=path.basename(caleCss);
//     if (fs.existsSync(caleCss)){
//         fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "Resurse/Css",numeFisCss ))// +(new Date()).getTime()
//     }
//     rez=sass.compile(caleScss, {"sourceMap":true});
//     fs.writeFileSync(caleCss,rez.css)
    
// }

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


//la pornirea serverului
vFisiere=fs.readdirSync(obGlobal.folderScss);
for( let numeFis of vFisiere ){
    if (path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}


// fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
//     if (eveniment=="change" || eveniment=="rename"){
//         let caleCompleta=path.join(obGlobal.folderScss, numeFis);
//         if (fs.existsSync(caleCompleta)){
//             compileazaScss(caleCompleta);
//         }
//     }
// })

fs.watch(obGlobal.folderScss, function(eveniment, numeFis) {
    if (eveniment == "change" || eveniment == "rename") {
        let caleCompletaScss = path.join(obGlobal.folderScss, numeFis);
        
        if (fs.existsSync(caleCompletaScss) && path.extname(numeFis) == ".scss") {
            let numeFisCss = numeFis.replace(".scss", ".css");
            
            compileazaScss(numeFis, numeFisCss);
        }
    }
});



//app.get("/:a/:b", function(req, res){
    //res.render("pagini/index");
    
//});

//app.get("/Resurse/Css/general.css", function(req, res){
    //res.sendFile(path.join(__dirname, "Resurse/Css/general.css"));
//});



app.get("/favicon.ico", function(req, res){ // unele browsere cauta faviconul in fisierul radacina
    res.sendFile(path.join(__dirname,"Resurse/Imagini/favicon/favicon.ico"))
});

app.get("/cale", function(req, res){
    console.log("Am primit o cerere GET la adresa /cale");
    res.send("Raspuns la <b style='color: red;'>cererea </b> GET la adresa /cale");
});

app.get("/cale/:a/:b", function(req, res){
    
    res.send(parseInt(req.params.a) + parseInt(req.params.b));
});

app.get("/cale2", function(req, res){
    res.write("ceva");
    res.write("altceva");
    res.end();
});

app.get("/*pagina", function(req, res){ 
    console.log("Cale pagina", req.url);
    if (req.url.startsWith("/Resurse") && path.extname(req.url)==""){ 
        afisareEroare(res,403); // ruta gresita
        return; 
    }
    if (path.extname(req.url)==".ejs"){ 
        afisareEroare(res,400); // cerere gresita
        return;
    }
    try{
        res.render("pagini"+req.url, function(err, rezRandare){ 
            if (err){
                if (err.message.includes("Failed to lookup view")){
                    afisareEroare(res,404); // pagina nu a fost gasita
                }
                else{
                    afisareEroare(res); 
                }
            }
            else{
                res.send(rezRandare);
                console.log("Rezultat randare", rezRandare);
            }
        });
    }
    catch(err){
        if (err.message.includes("Cannot find module")){ 
            afisareEroare(res,404)
        }
        else{
            afisareEroare(res);
        }
    }
});

// console.log("--- testare cale relativa ---");
// compileazaScss("galerie.scss", "test_relativ.css");

app.listen(8080);
console.log("Serverul a pornit!");