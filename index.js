const express= require("express");
const path= require("path");

app= express();
app.set("view engine", "ejs")

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

app.get("/", function(req, res){
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/:a/:b", function(req, res){
    res.render("pagini/index'");
    
});

//app.get("/Resurse/Css/general.css", function(req, res){
    //res.sendFile(path.join(__dirname, "Resurse/Css/general.css"));
//});

app.use("/Resurse", express.static(path.join(__dirname, "Resurse")));

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

app.listen(8080);
console.log("Serverul a pornit!");