// Filtros: estilo (botões), fonte (lista) e pesquisa livre.
// O estado fica no endereço (#estilo=...&fonte=...&q=...) para poderes partilhar links.
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll(".card"));
  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
  var q = document.getElementById("q");
  var src = document.getElementById("src");
  var count = document.getElementById("count");
  var empty = document.getElementById("empty");
  var genre = "";

  function readHash() {
    var p = new URLSearchParams(location.hash.slice(1));
    genre = p.get("estilo") || "";
    src.value = p.get("fonte") || "";
    q.value = p.get("q") || "";
  }

  function writeHash() {
    var p = new URLSearchParams();
    if (genre) p.set("estilo", genre);
    if (src.value) p.set("fonte", src.value);
    if (q.value.trim()) p.set("q", q.value.trim());
    var h = p.toString();
    history.replaceState(null, "", h ? "#" + h : location.pathname + location.search);
  }

  function apply() {
    var term = q.value.trim().toLowerCase();
    var shown = 0;
    cards.forEach(function (c) {
      var ok =
        (!genre || (" " + c.dataset.genres + " ").indexOf(" " + genre + " ") >= 0) &&
        (!src.value || c.dataset.source === src.value) &&
        (!term || c.dataset.search.indexOf(term) >= 0);
      c.hidden = !ok;
      if (ok) shown++;
    });
    chips.forEach(function (ch) {
      var on = ch.dataset.genre === genre;
      ch.classList.toggle("active", on);
      ch.setAttribute("aria-pressed", on ? "true" : "false");
    });
    count.textContent = shown + (shown === 1 ? " artigo" : " artigos");
    empty.hidden = shown > 0 || cards.length === 0;
    writeHash();
  }

  chips.forEach(function (ch) {
    ch.addEventListener("click", function () {
      genre = ch.dataset.genre;
      apply();
    });
  });
  q.addEventListener("input", apply);
  src.addEventListener("change", apply);

  // Datas relativas ("hoje", "ontem", "há 3 dias") calculadas no browser.
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  document.querySelectorAll("time[datetime]").forEach(function (t) {
    var d = new Date(t.getAttribute("datetime"));
    var day = new Date(d);
    day.setHours(0, 0, 0, 0);
    var diff = Math.round((today - day) / 864e5);
    t.title = d.toLocaleString("pt-PT");
    t.textContent = diff <= 0 ? "hoje" : diff === 1 ? "ontem" : "há " + diff + " dias";
  });

  readHash();
  apply();
})();
