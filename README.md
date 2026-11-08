# Novos Discos

Agregador de música lançada nos últimos 15 dias, a partir dos feeds RSS de 15 blogs de música
(Hipodrome, Bandcamp Daily, Terminal 313, Palms Out, HHV Mag, Truants, UKF, Dubblog, A Closer Listen,
Igloo Magazine, Headphone Commute, The Ransom Note, Electronic Groove, 5 Mag, Magnetic Mag).

Só entram artigos sobre **um disco concreto** (crítica, estreia ou anúncio) e dentro dos estilos
escolhidos. Entrevistas, listas, playlists, mixes, notícias de festivais, obituários e reedições antigas ficam de fora.

O site é gerado automaticamente de 6 em 6 horas e publicado de graça no **GitHub Pages**.
Não precisas de servidor nem de base de dados.

---

## Publicar o site (uma única vez, cerca de 10 minutos)

### 1. Criar conta e repositório no GitHub
1. Cria uma conta em <https://github.com> (se ainda não tiveres).
2. Clica em **New repository** (botão verde, ou <https://github.com/new>).
3. Nome: por exemplo `novos-discos`. Deixa **Public** selecionado.
   Não marques nenhuma opção de "Add README", ".gitignore" ou "license".
4. Clica **Create repository**.

### 2. Enviar os ficheiros
A forma mais simples é com a app **GitHub Desktop** (<https://desktop.github.com>):
1. Abre o GitHub Desktop e entra com a tua conta.
2. *File → Add local repository…* e escolhe a pasta `agregador-musica` (descompactada do zip).
   Se perguntar, escolhe **create a repository** e depois **Publish repository**, com o mesmo nome do passo 1.
   *(Em alternativa: diz-me o nome do repositório e eu envio os ficheiros por ti.)*

> Atenção: a pasta `.github` (onde está a automatização) começa por um ponto e fica escondida
> no Finder/Explorador. O GitHub Desktop envia-a na mesma. Se usares o upload pelo browser,
> confirma que ela aparece no repositório.

### 3. Ligar o GitHub Pages
1. No repositório, vai a **Settings → Pages**.
2. Em **Build and deployment → Source**, escolhe **GitHub Actions**.
3. Vai ao separador **Actions**, escolhe **Atualizar e publicar** e clica **Run workflow**.
4. Ao fim de 1 a 2 minutos, o site fica em `https://O-TEU-UTILIZADOR.github.io/novos-discos/`.

### 4. Último toque
Abre `config.mjs` (podes editar diretamente no site do GitHub, no ícone do lápis) e troca
`url:` pelo endereço real do teu site. Guarda ("Commit changes") e o site volta a ser publicado sozinho.

---

## Mudar coisas no dia a dia

Tudo está em **`config.mjs`**:

| Quero… | O que mudar |
|---|---|
| Mudar o nome do site | `title` |
| Ver 7 dias em vez de 5 | `days: 7` |
| Acrescentar um blog | junta uma linha em `feeds` com `name`, `url` (do feed RSS) e `genres` |
| Retirar um blog | apaga a linha dele em `feeds` |
| Criar um estilo novo | junta uma linha em `genres` com um `id`, um `name` e as palavras-chave |
| Afinar a classificação | acrescenta ou retira palavras-chave nos estilos |

Depois de guardares, o GitHub publica automaticamente a nova versão.

### Filtro de rigor
Em `config.mjs`, a lista `excludeTitles` tem as expressões que excluem um artigo (ex.: "interview",
"playlist"). Além disso, o título tem de ter o formato de um disco, por exemplo `Artista – Título`,
`Artista ~ Título`, `Artista, “Título”` ou `X lança ‘Título’`. Blogs que só publicam críticas
podem ter `allPosts: true` para saltar esta verificação.

Para perceber porque é que um artigo não apareceu, abre a última execução no separador **Actions**:
o passo `npm run build` lista todos os artigos incluídos e todos os recusados, com o motivo.

### Testar um blog novo antes de o juntar
No separador **Actions**, escolhe **Verificar feeds**, carrega em **Run workflow** e cola o endereço do
feed (ou vários, separados por espaços). O resultado mostra se o feed responde, quantos artigos tem
e os títulos mais recentes.

### Como os estilos são atribuídos
- Cada fonte pode ter estilos fixos (`genres`) ou estilos usados só quando nenhuma palavra-chave encaixa (`defaultGenres`).
- Além disso, procuramos as palavras-chave de cada estilo no título, nas categorias e no resumo do artigo.
- `exclusive: true` numa fonte faz com que ela fique só com os seus estilos fixos.
- Artigos sem nenhum estilo ficam de fora (ou vão para **Outros**, se `showUnmatched: true`).

---

## Ver se está tudo a funcionar

- **Separador Actions** no GitHub: cada execução mostra, no passo `npm run build`, uma linha por fonte:
  `✓ UKF: 4 recentes de 10` ou `✗ UKF: ERRO HTTP 404`.
  Se uma fonte der erro, o site é publicado na mesma com as restantes.
  Se **todas** falharem, nada é publicado e fica a versão anterior.
- O ficheiro `status.json` no teu site tem o mesmo resumo (ex.: `.../novos-discos/status.json`).
- O GitHub envia-te um email se uma execução falhar.

Notas:
- Se um blog mudar o endereço do feed, basta atualizar o `url` em `config.mjs`.
- O GitHub pode desativar execuções agendadas em repositórios sem atividade há 60 dias; se isso
  acontecer, recebes um email e basta carregar em "Enable workflow" no separador Actions.

---

## Para quem quiser mexer no código (opcional)

Precisa de [Node.js](https://nodejs.org) 20 ou mais recente.

```bash
npm install
npm run build      # lê os feeds e gera o site em dist/
npm run preview    # gera e abre o site em http://localhost:3000
npm test           # gera o site com feeds de exemplo (pasta test/fixtures)
```

Ficheiros:
- `config.mjs` – configuração (fontes, estilos, nº de dias)
- `build.mjs` – lê os feeds, filtra, classifica e gera o HTML
- `src/style.css`, `src/app.js` – aspeto e filtros da página
- `.github/workflows/publicar.yml` – automatização (de 6 em 6 horas)

## Boas práticas
O site mostra apenas título, um excerto curto e a imagem de destaque, sempre com o nome da
fonte e o link para o artigo original. Não copia textos completos.
