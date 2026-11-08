// =====================================================================
//  CONFIGURAÇÃO DO SITE
//  Este é o único ficheiro que precisas de editar no dia a dia.
// =====================================================================

export const site = {
  title: "Novos Discos",
  tagline: "Discos novos, escolhidos pelos melhores blogs de música e lojas de vinil.",
  // Quantos dias para trás mostrar.
  days: 15,
  // Endereço público do site (usado no feed RSS).
  url: "https://jorgevasco-ui.github.io/novos-discos/",
  language: "pt-PT",
  // Artigos que não encaixam em nenhum dos estilos abaixo ficam de fora.
  // Muda para true se quiseres vê-los na secção "Outros".
  showUnmatched: false,
  // Discos com um ano no título mais antigo do que isto (ex.: "(1993)") ficam
  // de fora, para não mostrar reedições e retrospetivas. 1 = aceita o ano passado.
  maxYearsOld: 1,
};

// ---------------------------------------------------------------------
//  ESTILOS
//  Cada estilo tem uma lista de palavras-chave. Se uma delas aparecer no
//  título, nas categorias ou no resumo de um artigo, o artigo recebe esse
//  estilo. Um artigo pode ter vários estilos. As palavras só contam
//  inteiras ("house" não apanha "warehouse").
//  `excludeIf`: se uma destas expressões aparecer, o estilo não é atribuído.
// ---------------------------------------------------------------------
export const genres = [
  { id: "dub-techno", name: "Dub Techno", keywords: ["dub techno", "dub-techno", "dubtechno", "basic channel", "chain reaction", "echospace", "deepchord", "dubtech"] },
  { id: "techno", name: "Techno", keywords: ["techno", "minimal techno", "detroit", "acid", "tresor", "hard groove"] },
  { id: "house-disco", name: "House & Disco", keywords: ["house", "deep house", "disco", "balearic", "edits", "boogie", "nu-disco", "cosmic", "garage house"] },
  { id: "electronica", name: "Electro & Electrónica", keywords: ["electro", "electronica", "idm", "braindance", "glitch", "coldwave", "minimal wave", "synth-pop", "synthpop", "ebm", "darkwave", "leftfield", "downtempo", "trip-hop", "breaks"] },
  { id: "dnb-bass", name: "Drum & Bass / Bass", keywords: ["drum & bass", "drum and bass", "drum n bass", "dnb", "d&b", "jungle", "dubstep", "neurofunk", "bass music", "uk garage", "2-step", "footwork"] },
  { id: "dub-reggae", name: "Dub & Reggae", keywords: ["dub", "dubs", "reggae", "dancehall", "steppers", "riddim", "riddims", "roots reggae"], excludeIf: ["dub techno", "dub-techno"] },
  { id: "ambient", name: "Ambient & Experimental", keywords: ["ambient", "experimental", "drone", "electroacoustic", "new age", "modular", "field recordings", "musique concrète", "modern classical"] },
  { id: "hiphop-jazz", name: "Hip Hop, Jazz & Soul", keywords: ["hip hop", "hip-hop", "rap", "rapper", "jazz", "soul", "funk", "r&b"] },
];

// Estilo dos artigos que não encaixam em nenhum estilo (só aparece se
// showUnmatched for true).
export const fallbackGenre = { id: "outros", name: "Outros" };

// ---------------------------------------------------------------------
//  FILTRO DE RIGOR
//  Só entram artigos sobre um disco concreto (crítica, estreia ou anúncio).
//  Um título conta como "disco" se tiver um destes formatos:
//    Artista – Título            Artista ~ Título        Artista :: Título
//    Artista, “Título”           Premiere: ...
//    X lança / estreia / partilha ‘Título’ (ou ... novo EP / LP / álbum)
//  E nunca entra se o título tiver uma destas expressões:
// ---------------------------------------------------------------------
export const excludeTitles = [
  "interview", "interviewed", "in conversation", "conversation with", "q&a", "podcast", "mixtape",
  "dj mix", "guest mix", "wire mix", "invisible jukebox", "cover mix", "live set", "live @", "festival",
  "lineup", "line-up", "tour", "live report", "gallery", "guide to", "ones to watch", "label spotlight",
  "records revisited", "throwback", "dust off", "flashback", "obituary", "has died", "passed away",
  "dedication", "bandcamp friday", "on bandcamp", "essential releases", "playlist", "visual velcro",
  "remix sunday", "from the mailbox", "truancy volume", "featured artist", "radar", "best of",
  "of the year", "black friday", "record store day", "book of the month", "five on friday",
];

// ---------------------------------------------------------------------
//  BOTÕES "PROCURAR NA LOJA"
//  Cada disco mostra estes botões, que abrem a pesquisa da loja com o
//  artista e o título. {q} é substituído pelo texto a procurar.
// ---------------------------------------------------------------------
export const shopSearch = [
  { name: "Bandcamp", url: "https://bandcamp.com/search?q={q}" },
  { name: "Juno", url: "https://www.juno.co.uk/search/?q%5Ball%5D%5B%5D={q}" },
  { name: "HHV", url: "https://www.hhv.de/en/search?term={q}" },
  { name: "Decks", url: "https://www.decks.de/decks/workfloor/search_db.php?wosuch=all&wassuch=atl&such={q}" },
];

// ---------------------------------------------------------------------
//  FONTES (feeds RSS)
//  `genres`: estilos que TODOS os artigos desta fonte recebem.
//  `defaultGenres`: estilos usados só quando nenhuma palavra-chave encaixa.
//  `exclusive: true`: a fonte fica só com `genres` (ignora palavras-chave).
//  `allPosts: true`: todos os artigos contam como discos (blogs que só
//     publicam críticas, ex.: Dubblog). Sem isto, aplica-se o filtro de rigor.
//  `kind: "loja"`: aparece no filtro "Lojas" em vez de "Blogs".
// ---------------------------------------------------------------------
export const feeds = [
  // Escolhidas pelo Jorge
  { name: "Hipodrome", url: "https://hipodrome.net/feed/", defaultGenres: ["electronica"] },
  { name: "Bandcamp Daily", url: "https://daily.bandcamp.com/feed" },
  { name: "Terminal 313", url: "https://terminal313.net/feed/", defaultGenres: ["techno"] },
  { name: "Palms Out", url: "https://palmsout.net/feed/", defaultGenres: ["house-disco"] },
  { name: "HHV Mag", url: "https://hhv-mag.com/feed/" },
  { name: "Truants", url: "https://truantsblog.com/feed/" },
  { name: "UKF", url: "https://ukf.com/feed/", defaultGenres: ["dnb-bass"] },
  { name: "Dubblog", url: "https://dubblog.de/en/feed/", defaultGenres: ["dub-reggae"], allPosts: true },

  // Acrescentadas (feeds testados a 8 nov 2026)
  { name: "A Closer Listen", url: "https://acloserlisten.com/feed/", defaultGenres: ["ambient"] },
  { name: "Igloo Magazine", url: "https://igloomag.com/feed", defaultGenres: ["ambient"] },
  { name: "Headphone Commute", url: "https://headphonecommute.com/feed/", defaultGenres: ["ambient"] },
  { name: "The Ransom Note", url: "https://www.theransomnote.com/feed/", defaultGenres: ["electronica"] },
  { name: "Electronic Groove", url: "https://www.electronicgroove.com/category/news/feed/", defaultGenres: ["techno"] },
  { name: "5 Mag", url: "https://www.5mag.net/feed/", defaultGenres: ["house-disco"] },
  { name: "Magnetic Mag", url: "https://www.magneticmag.com/feed/" },

  // Lojas de discos (novidades)
  { name: "Hard Wax", kind: "loja", url: "https://hardwax.com/feeds/news.rss", titleFormat: "colon", allPosts: true, defaultGenres: ["techno"] },
  {
    // A Decks.de não tem RSS: lemos as listas de novidades dos últimos 14 dias
    // (permitido pelo robots.txt da loja). Cada endereço é um estilo da loja.
    name: "Decks.de",
    kind: "loja",
    type: "decks",
    url: "https://www.decks.de/",
    allPosts: true,
    pages: [
      "https://www.decks.de/decks/workfloor/lists/list_db.php?wo=ten&now_Was=news&now_Date=tw", // Techno
      "https://www.decks.de/decks/workfloor/lists/list_db.php?wo=hon&now_Was=news&now_Date=tw", // House
      "https://www.decks.de/decks/workfloor/lists/list_db.php?wo=ban&now_Was=news&now_Date=tw", // Drum & Bass
    ],
  },
];
