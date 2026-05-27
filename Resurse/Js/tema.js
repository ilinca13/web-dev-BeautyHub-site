

if (localStorage.getItem("tema") === "dark") {
    document.body.classList.add("dark");
    document.documentElement.setAttribute("data-bs-theme", "dark");
} 
else {
    document.body.classList.remove("dark");
    document.documentElement.setAttribute("data-bs-theme", "light");
}