// =====================================================================
//  CONFIGURAÇÃO DO SITE
//  Este é o único ficheiro que precisas de editar no dia a dia.
// =====================================================================

export const site = {
  title: "Novos Discos",
  tagline: "Os discos novos que os melhores blogs de música andam a destacar.",
  // Quantos dias para trás mostrar.
  days: 5,
  // Endereço público do site (usado no feed RSS). Atualiza depois de publicar.
  url: "https://jorgevasco-ui.github.io/novos-discos/",
  language: "pt-PT",
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
  { id: "dub-techno", name: "Dub Techno", keywords: ["dub techno", "dub-techno", "basic channel", "chain reaction", "echospace", "deepchord", "dubtech"] },
  { id: "techno", name: "Techno", keywords: ["techno", "minimal", "detroit"] },
  { id: "house-disco", name: "House & Disco", keywords: ["house", "disco", "balearic", "edits", "boogie", "nu-disco", "cosmic"] },
  { id: "dnb-bass", name: "Drum & Bass / Bass", keywords: ["drum & bass", "drum and bass", "drum n bass", "dnb", "d&b", "jungle", "dubstep", "liquid", "neurofunk", "breakbeat", "garage", "bass music"] },
  { id: "dub-reggae", name: "Dub & Reggae", keywords: ["dub", "reggae", "dancehall", "steppers", "roots reggae"], excludeIf: ["dub techno", "dub-techno"] },
  { id: "ambient", name: "Ambient & Experimental", keywords: ["ambient", "experimental", "drone", "electroacoustic", "new age", "modular"] },
  { id: "hiphop-jazz", name: "Hip Hop, Jazz & Soul", keywords: ["hip hop", "hip-hop", "rap", "jazz", "soul", "funk", "r&b"] },
];

// Estilo usado quando um artigo não corresponde a nenhuma palavra-chave
// e a fonte não tem estilo por defeito.
export const fallbackGenre = { id: "outros", name: "Outros" };

// ---------------------------------------------------------------------
//  FONTES (feeds RSS)
//  `genres`: estilos que TODOS os artigos desta fonte recebem.
//  Deixa vazio [] para fontes que falam de tudo (aí usamos as palavras-chave).
//  `exclusive: true` faz com que a fonte receba apenas os seus estilos
//  (ignora as palavras-chave). Útil para blogs muito especializados.
// ---------------------------------------------------------------------
export const feeds = [
  { name: "Hipodrome", url: "https://hipodrome.net/feed/", genres: [] },
  { name: "Bandcamp Daily", url: "https://daily.bandcamp.com/feed", genres: [] },
  { name: "Terminal 313", url: "https://terminal313.net/category/dub-techno/feed/", genres: ["dub-techno"], exclusive: true },
  { name: "Palms Out", url: "https://palmsout.net/feed/", genres: ["house-disco"] },
  { name: "HHV Mag", url: "https://hhv-mag.com/feed/", genres: [] },
  { name: "Truants", url: "https://truantsblog.com/feed/", genres: [] },
  { name: "UKF", url: "https://ukf.com/feed/", genres: ["dnb-bass"] },
  { name: "Dubblog", url: "https://dubblog.de/en/feed/", genres: ["dub-techno"] },
];
