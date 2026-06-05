window.onload = function () { // sa avem elementele deja incarcate, evenimentul principal din browser care se declanseaza automat

    // observatii
    // datalist: se cauta subsiruri, majuscule nu cont dar spatiile da
    // textare: diacriticele nu mai conteaza si majculele nu conteaza + obligatorii virgule ca separatori daca sunt mai multe cuvinte

    let produseSalvateInitial = Array.from(document.getElementsByClassName("produs")); // document.getElementsByClassName("produs") HTMLCollection (live) toate produsele așa cum sunt ele inițial în HTML, pentru a putea reveni la această stare inițială când se apasă butonul de resetare filtre
    // array static creat din HTMLCollection live, deci nu se modifică dacă ulterior se adaugă sau elimină produse în DOM, ci păstrează referințe către elementele inițiale, așa cum erau ele la încărcarea paginii
    // array de elemente DOM, deci dacă modificăm elementele din acest array, se modifică și în DOM pentru că sunt aceleași obiecte (referințe către aceleași elemente)

    let containerProduse = produseSalvateInitial.length > 0 ? produseSalvateInitial[0].parentElement : null;

    // Folosește un operator ternar (condiție ? val_adevărat : val_fals) pentru a verifica dacă avem cel puțin un produs în vector (produseSalvateInitial.length > 0), dacă da, accesează primul produs [0] și îi extrage nodul părinte din DOM (.parentElement), altfel stochează valoarea null în containerProduse. Acest nod părinte este important pentru a putea reatașa produsele în DOM în cazul resetării filtrelor, deoarece atunci când aplicăm filtrele, unele produse pot fi eliminate din DOM (display: none), dar nu sunt șterse definitiv, deci putem să le reatașăm la același nod părinte pentru a reveni la starea inițială.
    

    //  Bonus 7: normalizare text (diacritice + majuscule)
    function eliminaDiacritice(text) {
        if (!text) return ""; // daca este undefined sau null, returnam un string gol 
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                   .replace(/ș/g, "s").replace(/ț/g, "t")
                   .replace(/Ș/g, "s").replace(/Ț/g, "t");
    }




    // validare inputuri filtre
    function valideazaInputuri() {
        // preluare elemente html de validat
        let elNume = document.getElementById("inp-nume");
        let elDescriere = document.getElementById("inp-descriere"); // textare
        let elDatalist = document.getElementById("inp-datalist");
        let selectMultiplu = document.getElementById("inp-subcategorie");
        let eValid = true; // pp ca toate datele sunt valide initial

        let elementeDeValidat = [elNume, elDescriere, elDatalist, selectMultiplu]; // Pune referințele elementelor DOM într-un vector temporar pentru a le procesa mai ușor în bucle, astfel evităm repetarea codului pentru fiecare element în parte când vrem să le resetăm clasele de validare sau să le aplicăm clasele de validare în funcție de rezultat. Acest vector conține referințe către elementele DOM, deci orice modificare făcută asupra acestor elemente prin intermediul acestui vector se va reflecta și în DOM, deoarece sunt aceleași obiecte (referințe către aceleași elemente). 
        elementeDeValidat.forEach(el => {
            if (el) {
                el.classList.remove("is-invalid", "is-valid"); // Curăță clasele de feedback vizual din Bootstrap pentru a reîncepe validarea de la zero
            }
        });

        let regexCaractereInvalide = /[^a-zA-ZășțîâĂȘȚÎÂ\s-]/;
        // Definește o expresie regulată (Regex) care caută orice caracter care NU (datorită lui ^) este literă, diacritică, spațiu (\s) sau cratimă


        // validare nume
        if (elNume) {
            let valNume = elNume.value.trim(); // trim sterge spatiile de la inceput si de la sf
            if (valNume !== "") {
                if (regexCaractereInvalide.test(valNume)) {// testeaza daca contine caractere care nu sunt permise
                    elNume.classList.add("is-invalid"); // adauga clasa bootstrap pentru a inrosi chenarul
                    eValid = false;
                } else {
                    elNume.classList.add("is-valid");
                }
            }
        }

        // validare textare
        if (elDescriere) {
            let valDescriere = elDescriere.value.trim();
            let areEroareDescriere = false;

            if (valDescriere !== "") {
                if (/[^a-zA-ZășțîâĂȘȚÎÂ\s,-]/.test(valDescriere)) {
                    areEroareDescriere = true;
                }
                if (valDescriere.includes(" ") && !valDescriere.includes(",")) { // daca are spatiu dar nu contine virgule separator
                    areEroareDescriere = true;
                }
            }

            if (areEroareDescriere) {
                elDescriere.classList.add("is-invalid");
                eValid = false;
            } else if (valDescriere !== "") {
                elDescriere.classList.remove("is-invalid");
                elDescriere.classList.add("is-valid");
            }
        }

        // validare datalist (verificare daca valoarea exista in lista)
        if (elDatalist) {
            let valDatalistRaw = elDatalist.value.trim();
            let valCautata = valDatalistRaw.toLowerCase();

            if (valDatalistRaw !== "") {
                if (regexCaractereInvalide.test(valDatalistRaw)) {
                    elDatalist.classList.add("is-invalid");
                    eValid = false;
                } 
                else {
                    let optionsDatalist = document.querySelectorAll("datalist option"); // preia toate elementele <option> care sunt copii ai elementului <datalist>, adică toate opțiunile disponibile în datalist, pentru a verifica dacă valoarea introdusă de utilizator se potrivește cu una dintre aceste opțiuni
                    let gasit = false;

                    for (let opt of optionsDatalist) {
                        if (opt.value.trim().toLowerCase() === valCautata) {
                            gasit = true;
                            break;
                        }
                    }

                    if (!gasit) {
                        elDatalist.classList.add("is-invalid");
                        eValid = false;
                    } else {
                        elDatalist.classList.add("is-valid");
                    }
                }
            }
        }

        // validare select multiplu
        if (selectMultiplu) {
            let areSelectie = false; // variabilă de control pentru a verifica dacă există cel puțin o opțiune selectată în selectul multiplu
            for (let option of selectMultiplu.options) {
                if (option.selected) {
                    areSelectie = true;
                    break;
                }
            }
            if (!areSelectie) {
                selectMultiplu.classList.add("is-invalid");
                eValid = false;
            } else {
                selectMultiplu.classList.add("is-valid");
            }
        }

        return eValid;
    }

    // corectare automata textare
    let elDescriereDinamica = document.getElementById("inp-descriere");
    if (elDescriereDinamica) {
        elDescriereDinamica.oninput = function () { // evenimentul nativ oninput se declanșează de fiecare dată când utilizatorul modifică conținutul unui element de input sau textarea, fie prin tastare, lipire sau ștergere, permițându-ne să aplicăm validarea și corectarea în timp real pe măsură ce utilizatorul interacționează cu câmpul de descriere
            let valDescriere = this.value.trim();
            let areEroare = false;

            if (valDescriere !== "") {
                if (/[^a-zA-ZășțîâĂȘȚÎÂ\s,-]/.test(valDescriere)) areEroare = true;
                if (valDescriere.includes(" ") && !valDescriere.includes(",")) areEroare = true;
            }

            if (!areEroare) {
                this.classList.remove("is-invalid");
                if (valDescriere !== "") this.classList.add("is-valid");
            } else {
                this.classList.remove("is-valid");
                this.classList.add("is-invalid");
            }
        };
    }




    // algoritmul Levenshtein: fara potrivire exacta la nume, acceptă și un nume greșit dacă nu diferă decât cu maxim 2 litere față de numele real
    function levenshtein(a, b) {
        let tmp;
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        if (a.length > b.length) { tmp = a; a = b; b = tmp; }

        let row = Array(a.length + 1);
        for (let i = 0; i <= a.length; i++) row[i] = i;

        for (let i = 1; i <= b.length; i++) {
            let prev = i;
            for (let j = 1; j <= a.length; j++) {
                let val;
                if (b[i - 1] === a[j - 1]) {
                    val = row[j - 1];
                } else {
                    val = Math.min(row[j - 1] + 1, Math.min(prev + 1, row[j] + 1));
                }
                row[j - 1] = prev;
                prev = val;
            }
            row[a.length] = prev;
        }
        return row[a.length];
    }




    // actualizare automata range 
    let inpPretDinamicitate = document.getElementById("inp-pret"); // sliderul de pret
    if (inpPretDinamicitate) {
        // la pornirea serverului
        let infoRange = document.getElementById("infoRange"); // pretul din paranteze
        if (infoRange) infoRange.innerHTML = `(${inpPretDinamicitate.value})`; // innerHTML modifica continutul tag ului, ${} executa codul din interiorul acoladelor și inserează rezultatul în text

        inpPretDinamicitate.oninput = function () { // se declanseaza de fiecare daca cand utilizatorul trage de buton
            let val = this.value.trim();
            if (infoRange) infoRange.innerHTML = `(${val})`;
        };
    }







    // filtrare + bonus 7
    let butonFiltrare = document.getElementById("filtrare");
    if (butonFiltrare) {
        butonFiltrare.onclick = function () { // de fiecare data cand se da click
            
            if (!valideazaInputuri()) return; // daca sunt inputuri invalide nu se mai executa filtrarea

            // Preluare text și eliminare diacritice din inputul de nume
            let rawInpNume = document.getElementById("inp-nume") ? document.getElementById("inp-nume").value.trim().toLowerCase() : "";
            let inpNume = eliminaDiacritice(rawInpNume);

            let inpPretMin = document.getElementById("inp-pret") ? parseFloat(document.getElementById("inp-pret").value.trim()) : 0; // converteste din string in numar zecimal

            let inpDatalist = document.getElementById("inp-datalist") ? document.getElementById("inp-datalist").value.trim().toLowerCase() : "";

            let inpCategorie = document.getElementById("inp-categorie") ? document.getElementById("inp-categorie").value.trim().toLowerCase() : "toate"; // daca selectul nu exista sau nu are valoare, consideram ca e selectata optiunea "toate" pentru a nu filtra dupa categorie

            // selecteaza radio buttons
            let grupRadio = document.getElementsByName("gr_cantitate");

            let cantitateMin = 0, cantitateMax = 10000000, isToate = true;
            for (let rad of grupRadio) {
                if (rad.checked) {
                    if (rad.value !== "toate") { // daca valoarea nu e toate avem un grup definit
                        let parti = rad.value.split(":"); // sparge string ul valorii in doua parti separate de ":", prima parte va fi cantitatea minima, a doua parte va fi cantitatea maxima
                        cantitateMin = parseInt(parti[0]);
                        cantitateMax = parseInt(parti[1]);        
                        isToate = false;
                    } else {
                        isToate = true;
                    }
                    break; // doar un singur element poate fi bifat la un moment dat
                }
            }


            // textarea - eliminare diacritice din inputul de descriere
            let elDescriereInput = document.getElementById("inp-descriere");
            let textExcludere = elDescriereInput ? elDescriereInput.value.trim().toLowerCase() : "";
            textExcludere = eliminaDiacritice(textExcludere);
            let cuvinteExcluse = textExcludere ? textExcludere.split(",").map(c => c.trim()).filter(c => c.length > 0) : [];
            // Transformă șirul într-un vector de cuvinte: împarte textul după virgulă (.split), curăță spațiile parazite ale fiecărui cuvânt (.map) și elimină eventualele intrări goale (.filter)

            // select multiplu 
            let selectMultiplu = document.getElementById("inp-subcategorie");
            let gameSelectate = [];
            if (selectMultiplu) {
                for (let option of selectMultiplu.options) {
                    if (option.selected) {
                        gameSelectate.push(option.value.trim().toLowerCase());
                    }
                }
            }

            // grupul de checkbox + radio (Ingrediente)
            let chkIngrediente = document.getElementsByClassName("chk-ingredient");
            let reguliIngrediente = []; //Pregătește un vector gol care va stoca regulile de filtrare sub formă de obiecte (ex: { valoare: "aloe", tip: "nu are" })
            for (let i = 0; i < chkIngrediente.length; i++) {
                if (chkIngrediente[i].checked) {
                    let ingredientVal = chkIngrediente[i].value.toLowerCase();
                    let radios = document.getElementsByName("rad-ing-" + i); //Caută dinamic în pagină sub-grupul de butoane radio asociate acestui ingredient
                    let tipRegula = "are"; // regula implicita
                    for (let r of radios) { // Parcurge cele două butoane radio din sub-grup pentru a determina opțiunea reală selectată
                        if (r.checked) {
                            tipRegula = r.value;
                            break;
                        }
                    }
                    reguliIngrediente.push({ valoare: ingredientVal, tip: tipRegula });
                }
            }




            let produse = document.getElementsByClassName("produs");

            for (let prod of produse) { // bucla principala a algoritmului
                // Preluare text și curățare diacritice din numele produsului curent
                let elNume = prod.getElementsByClassName("val-nume")[0];
                let numeCompleteRaw = elNume ? elNume.innerText.trim().toLowerCase() : "";
                let numeComplete = eliminaDiacritice(numeCompleteRaw);

                let elBrand = prod.getElementsByClassName("val-brand")[0];
                let brand = elBrand ? elBrand.innerText.trim().toLowerCase() : "";

                let elGramaj = prod.getElementsByClassName("val-gramaj")[0];
                let cantitate = elGramaj ? parseInt(elGramaj.innerText.trim()) : 0;

                let elPret = prod.getElementsByClassName("val-pret")[0];
                let pret = elPret ? parseFloat(elPret.innerText.trim()) : 0; // parseFloat converteste la numar real

                let elIngrediente = prod.getElementsByClassName("val-ingrediente")[0];
                let ingredienteProdus = elIngrediente ? elIngrediente.innerText.trim().toLowerCase() : "";

                let elSubcatPentruSelectSimplu = prod.getElementsByClassName("val-subcategorie")[0];
                let subcategoriePentruSelectSimplu = elSubcatPentruSelectSimplu ? elSubcatPentruSelectSimplu.innerText.trim().toLowerCase() : "";

                let elSubcat = prod.getElementsByClassName("val-subcategorie")[0];
                let subcategorie = elSubcat ? elSubcat.innerText.trim().toLowerCase() : "";
               
                // Preluare text și curățare diacritice din descrierea produsului curent
                let elDescriere = prod.getElementsByClassName("val-descriere")[0];
                let descriereRaw = elDescriere ? elDescriere.innerText.trim().toLowerCase() : "";
                let descriere = eliminaDiacritice(descriereRaw); 

                // Logica evaluare condiție nume (asigură potrivirea uniformă și pentru Levenshtein)
                let condNume = (inpNume === "") || numeComplete.includes(inpNume);
                if (!condNume && inpNume !== "") {
                    // Sparge numele complet al produsului într-un vector de cuvinte individuale, ignorând spațiile multiple (\s+)
                    let cuvinteNumeProdus = numeComplete.split(/\s+/);
                    for (let cuvant of cuvinteNumeProdus) {
                        if (levenshtein(cuvant, inpNume) <= 2) {
                            condNume = true;
                            break;
                        }
                    }
                }
                
                let condGramaj = isToate || (cantitate >= cantitateMin && cantitate < cantitateMax);
                let condPret = pret >= inpPretMin;
                let condDatalist = (inpDatalist === "") || brand.includes(inpDatalist);
                let condCategorie = (inpCategorie === "toate" || subcategoriePentruSelectSimplu === inpCategorie);
                let condSelectMultiplu = (gameSelectate.length === 0) || gameSelectate.includes("toate") || gameSelectate.includes(subcategorie);

                let condExcludere = true;
                for (let cuvant of cuvinteExcluse) {
                    if (descriere.includes(cuvant)) {
                        condExcludere = false;
                        break;
                    }
                }

                let condIngredienteComplex = true;
                for (let regula of reguliIngrediente) {
                    let contineIngredient = ingredienteProdus.includes(regula.valoare);
                    if (regula.tip === "are" && !contineIngredient) {
                        condIngredienteComplex = false;
                        break;
                    }
                    if (regula.tip === "nu are" && contineIngredient) {
                        condIngredienteComplex = false;
                        break;
                    }
                }

                if (condNume && condGramaj && condPret && condDatalist && condCategorie && condSelectMultiplu && condExcludere && condIngredienteComplex) {
                    prod.style.display = ""; // daca respecta toate conditiile apare
                } else {
                    prod.style.display = "none";
                }
            }
        };
    }

    // resetare filtre
    let butonResetare = document.getElementById("resetare");
    if (butonResetare) {
        butonResetare.onclick = function () {
            
            let acceptaResetare = confirm("Ești sigur că vrei să resetezi toate filtrele și sortările?"); // fereastra pop up confrimare browser
            if (!acceptaResetare) return; 

            let idsDeResetat = ["inp-nume", "inp-descriere", "inp-datalist", "inp-subcategorie"];
            idsDeResetat.forEach(id => {
                let el = document.getElementById(id);
                if (el) {
                    if (el.tagName !== "SELECT") el.value = "";
                    el.classList.remove("is-invalid", "is-valid");
                }
            });
            
            let r = document.getElementById("inp-pret");
            if (r) {
                r.value = 0;
                if (document.getElementById("infoRange")) document.getElementById("infoRange").innerHTML = "(0)";
            }
            
            if (document.getElementById("inp-categorie")) document.getElementById("inp-categorie").value = "toate";
            if (document.getElementById("rad-toate")) document.getElementById("rad-toate").checked = true;

            let selectMultiplu = document.getElementById("inp-subcategorie");
            if (selectMultiplu) {
                for (let i = 0; i < selectMultiplu.options.length; i++) {
                    selectMultiplu.options[i].selected = (i === 0);
                }
            }

            // resetare toggle buttons ingrediente
            let chkIngrediente = document.getElementsByClassName("chk-ingredient");
            for (let i = 0; i < chkIngrediente.length; i++) {
                chkIngrediente[i].checked = false;
                let radios = document.getElementsByName("rad-ing-" + i);
                if (radios.length > 0) radios[0].checked = true;
            }

            if (containerProduse && produseSalvateInitial.length > 0) {
                for (let prod of produseSalvateInitial) {
                    containerProduse.appendChild(prod); 
                }
            }

            let Urban = document.getElementsByClassName("produs");
            for (let prod of Urban) {
                prod.style.display = "";
            }
        };
    }

    // sortare
    function executaSortare(semn) {
        if (!valideazaInputuri()) return;

        let Urban = document.getElementsByClassName("produs");
        let vProduse = Array.from(Urban); // elemente DOM - obiecte de tip nod HTML, vector static creat din HTMLCollection live, deci nu se modifică dacă ulterior se adaugă sau elimină produse în DOM, ci păstrează referințe către elementele inițiale, așa cum erau ele la încărcarea paginii, dar conține referințe către aceleași elemente DOM, deci dacă modificăm elementele din acest vector, se modifică și în DOM pentru că sunt aceleași obiecte (referințe către aceleași elemente)
        if (vProduse.length === 0) return;

        vProduse.sort(function (a, b) { // functie de comparare pentru sortare, primeste doua elemente din vectorul de produse si returneaza un numar negativ daca a ar trebui sa fie inaintea lui b, un numar pozitiv daca a ar trebui sa fie dupa b sau 0 daca sunt egale, semn este 1 pentru crescator si -1 pentru descrescator
            let elPretA = a.getElementsByClassName("val-pret")[0];
            let elGramajA = a.getElementsByClassName("val-gramaj")[0];
            let pretA = elPretA ? parseFloat(elPretA.innerText.trim()) : 1;
            let gramajA = elGramajA ? parseFloat(elGramajA.innerText.trim()) : 0;
            let raportA = gramajA / pretA;

            let elSubcatA = a.getElementsByClassName("val-subcategorie")[0];
            let subcatA = elSubcatA ? elSubcatA.innerText.trim().toLowerCase() : "";

            let elPretB = b.getElementsByClassName("val-pret")[0];
            let elGramajB = b.getElementsByClassName("val-gramaj")[0];
            let pretB = elPretB ? parseFloat(elPretB.innerText.trim()) : 1;
            let gramajB = elGramajB ? parseFloat(elGramajB.innerText.trim()) : 0;
            let raportB = gramajB / pretB;

            let elSubcatB = b.getElementsByClassName("val-subcategorie")[0];
            let subcatB = elSubcatB ? elSubcatB.innerText.trim().toLowerCase() : "";

            if (raportA !== raportB) {
                return semn * (raportA - raportB);
            }
            return semn * subcatA.localeCompare(subcatB);
        });

        let container = Urban[0].parentElement;
        for (let prod of vProduse) {
            container.appendChild(prod);
        }
    }

    let btnCresc = document.getElementById("sortCresc");
    let btnDescresc = document.getElementById("sortDescresc");

    if (btnCresc) btnCresc.onclick = function () { executaSortare(1); };
    if (btnDescresc) btnDescresc.onclick = function () { executaSortare(-1); };




    function afiseazaCalculDinamic(textMesaj) {
        let divCalcul = document.createElement("div"); // in memorie un element div  care nu este inca atasat de pagina
        let id = "div-calcul-dinamic";
        divCalcul.id = id;

        // calse utilitare bootstrap
        divCalcul.className = "alert alert-info position-fixed bottom-0 end-0 m-3 shadow-lg z-3";
        divCalcul.style.maxWidth = "350px";

        divCalcul.innerHTML = `<i class="bi bi-info-circle-fill me-2"></i> ${textMesaj}`;
        document.body.appendChild(divCalcul); // il ataseaza la sf tagului body

        setTimeout(function () {
            divCalcul.remove();
        }, 3000); // dupa 3 secunde, elementul div creat pentru mesaj va fi eliminat automat din DOM, astfel mesajul dispare de pe ecran
    }

    let btnMedia = document.getElementById("calcul-media");
    if (btnMedia) {
        btnMedia.onclick = function () {
            if (!valideazaInputuri()) return;

            let listaProduse = document.getElementsByClassName("produs");
            let suma = 0;
            let nrProduse = 0;

            for (let prod of listaProduse) {
                if (prod.style.display !== "none") {
                    let elPret = prod.getElementsByClassName("val-pret")[0];
                    if (elPret) {
                        suma += parseFloat(elPret.innerText.trim());
                        nrProduse++;
                    }
                }
            }

            let medie = nrProduse > 0 ? (suma / nrProduse).toFixed(2) : 0; // rotunjeste la 2 zecimale
            afiseazaCalculDinamic(`Prețul mediu al produselor afișate este: <strong>${medie} lei</strong> (calculat pentru ${nrProduse} produse).`);
        };
    }

    window.onkeydown = function (e) {
        if (e.key.toLowerCase() === "c" && e.altKey) {
            e.preventDefault();
            if (!valideazaInputuri()) return;

            let listaProduse = document.getElementsByClassName("produs");
            let suma = 0;
            for (let prod of listaProduse) {
                if (prod.style.display !== "none") {
                    let elPret = prod.getElementsByClassName("val-pret")[0];
                    if (elPret) suma += parseFloat(elPret.innerText.trim());
                }
            }
            afiseazaCalculDinamic(`Suma totală a produselor vizibile: <strong>${suma.toFixed(2)} lei</strong>`);
        }
    };
};