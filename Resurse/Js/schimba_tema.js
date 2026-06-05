window.addEventListener("DOMContentLoaded", function() {
    let btnTema = document.getElementById("btn-tema");
    let iconTema = document.getElementById("icon-tema");

    
    if (localStorage.getItem("tema") === "dark") { // daca utilizatorul a salvat tema dark in localStorage la vizitele anterioare, aplicam tema dark la incarcarea paginii
        if (btnTema) btnTema.checked = true;
        if (iconTema) {
            iconTema.classList.remove("bi-sun-fill");
            iconTema.classList.add("bi-moon-fill");
        }
    }

    
    if (btnTema) {
        btnTema.onclick = function() {
            if (document.body.classList.contains("dark")) {
                
                document.body.classList.remove("dark");
                document.documentElement.setAttribute("data-bs-theme", "light"); 
                localStorage.removeItem("tema"); 
                
                if (iconTema) {
                    iconTema.classList.remove("bi-moon-fill");
                    iconTema.classList.add("bi-sun-fill");
                }
            }
            else {
                
                document.body.classList.add("dark");
                document.documentElement.setAttribute("data-bs-theme", "dark");  
                localStorage.setItem("tema", "dark");
                
                if (iconTema) {
                    iconTema.classList.remove("bi-sun-fill");
                    iconTema.classList.add("bi-moon-fill");
                }
            }
        };
    }
});