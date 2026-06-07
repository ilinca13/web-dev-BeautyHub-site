window.onload = function () { 

    
    // datalist: se cauta subsiruri, majuscule nu cont dar spatiile 
    // textare: diacriticele si majculele nu conteaza + obligatorii virgule ca separatori daca sunt mai multe cuvinte

    let produseSalvateInitial = Array.from(document.getElementsByClassName("produs")); 
    
    

    let containerProduse = produseSalvateInitial.length > 0 ? produseSalvateInitial[0].parentElement : null;

    
    

    //  bonus 7: diacritice + majuscule
    function eliminaDiacritice(text) {
        if (!text) return ""; // undefined sau null
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
                   .replace(/ș/g, "s").replace(/ț/g, "t")
                   .replace(/Ș/g, "s").replace(/Ț/g, "t");
    }




    // validare inputuri filtre
    function valideazaInputuri() {
        // preluare elemente html de validat
        let elNume = document.getElementById("inp-nume");
        let elDescriere = document.getElementById("inp-descriere"); 
        let elDatalist = document.getElementById("inp-datalist");
        let selectMultiplu = document.getElementById("inp-subcategorie");
        let eValid = true; // pp ca toate datele sunt valide initial

        let elementeDeValidat = [elNume, elDescriere, elDatalist, selectMultiplu];
        elementeDeValidat.forEach(el => {
            if (el) {
                el.classList.remove("is-invalid", "is-valid"); 
            }
        });

        let regexCaractereInvalide = /[^a-zA-ZășțîâĂȘȚÎÂ\s-]/;

        // validare nume
        if (elNume) {
            let valNume = elNume.value.trim(); 
            if (valNume !== "") {
                if (regexCaractereInvalide.test(valNume)) {
                    elNume.classList.add("is-invalid"); 
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
                if (valDescriere.includes(" ") && !valDescriere.includes(",")) { 
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
                    let optionsDatalist = document.querySelectorAll("datalist option"); // toate elementele <option> care sunt copii ai elementului <datalist>
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
            let areSelectie = false; 
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
        elDescriereDinamica.oninput = function () { 
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




    // algoritmul levenshtein: accepta un nume gresit daca nu difera decat cu maxim 2 litere 
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




    // actualizare automata range pret
    let inpPretDinamicitate = document.getElementById("inp-pret"); 
    if (inpPretDinamicitate) {
        // la pornirea serverului
        let infoRange = document.getElementById("infoRange"); // pretul din paranteze
        if (infoRange) infoRange.innerHTML = `(${inpPretDinamicitate.value})`; 

        inpPretDinamicitate.oninput = function () { 
            let val = this.value.trim();
            if (infoRange) infoRange.innerHTML = `(${val})`;
        };
    }







    // filtrare + bonus 7
    let butonFiltrare = document.getElementById("filtrare");
    if (butonFiltrare) {
        butonFiltrare.onclick = function () { 
            
            if (!valideazaInputuri()) return; 

            
            let rawInpNume = document.getElementById("inp-nume") ? document.getElementById("inp-nume").value.trim().toLowerCase() : "";
            let inpNume = eliminaDiacritice(rawInpNume);

            let inpPretMin = document.getElementById("inp-pret") ? parseFloat(document.getElementById("inp-pret").value.trim()) : 0; 

            let inpDatalist = document.getElementById("inp-datalist") ? document.getElementById("inp-datalist").value.trim().toLowerCase() : "";

            let inpCategorie = document.getElementById("inp-categorie") ? document.getElementById("inp-categorie").value.trim().toLowerCase() : "toate"; 


            let grupRadio = document.getElementsByName("gr_cantitate");

            let cantitateMin = 0, cantitateMax = 10000000, isToate = true;
            for (let rad of grupRadio) {
                if (rad.checked) {
                    if (rad.value !== "toate") { 
                        let parti = rad.value.split(":"); 
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
            // vector de cuvinte

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

            
            let chkIngrediente = document.getElementsByClassName("chk-ingredient");
            let reguliIngrediente = []; 
            for (let i = 0; i < chkIngrediente.length; i++) {
                if (chkIngrediente[i].checked) {
                    let ingredientVal = chkIngrediente[i].value.toLowerCase(); // val checkbox
                    let radios = document.getElementsByName("rad-ing-" + i); 
                    let tipRegula = "are"; // regula implicita
                    for (let r of radios) { 
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
               
                let elNume = prod.getElementsByClassName("val-nume")[0];
                let numeCompleteRaw = elNume ? elNume.innerText.trim().toLowerCase() : "";
                let numeComplete = eliminaDiacritice(numeCompleteRaw);

                let elBrand = prod.getElementsByClassName("val-brand")[0];
                let brand = elBrand ? elBrand.innerText.trim().toLowerCase() : "";

                let elGramaj = prod.getElementsByClassName("val-gramaj")[0];
                let cantitate = elGramaj ? parseInt(elGramaj.innerText.trim()) : 0;

                let elPret = prod.getElementsByClassName("val-pret")[0];
                let pret = elPret ? parseFloat(elPret.innerText.trim()) : 0; 

                let elIngrediente = prod.getElementsByClassName("val-ingrediente")[0];
                let ingredienteProdus = elIngrediente ? elIngrediente.innerText.trim().toLowerCase() : "";

                let elSubcatPentruSelectSimplu = prod.getElementsByClassName("val-subcategorie")[0];
                let subcategoriePentruSelectSimplu = elSubcatPentruSelectSimplu ? elSubcatPentruSelectSimplu.innerText.trim().toLowerCase() : "";

                let elSubcat = prod.getElementsByClassName("val-subcategorie")[0];
                let subcategorie = elSubcat ? elSubcat.innerText.trim().toLowerCase() : "";
               
                
                let elDescriere = prod.getElementsByClassName("val-descriere")[0];
                let descriereRaw = elDescriere ? elDescriere.innerText.trim().toLowerCase() : "";
                let descriere = eliminaDiacritice(descriereRaw); 

                
                let condNume = (inpNume === "") || numeComplete.includes(inpNume);
                if (!condNume && inpNume !== "") {
                    // sparge numele complet al produsului intr un vector de cuvinte individuale ignora spatiile multiple
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
            
            let acceptaResetare = confirm("Ești sigur că vrei să resetezi toate filtrele și sortările?"); 
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
        let vProduse = Array.from(Urban); 
        if (vProduse.length === 0) return;

        vProduse.sort(function (a, b) { 
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
        }, 3000); // dupa 3 secunde, elementul  va fi eliminat automat din DOM
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

            let medie = nrProduse > 0 ? (suma / nrProduse).toFixed(2) : 0; 
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