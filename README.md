## Introduction

This script is used to scrape data from most of the wikis on fandom.com. It retrieves only the text contained in a given div, and can be easily adjusted via `class/Analyzer.mjs`.

## Installation

### npm

```sh
npm install
npm start
```

### pnpm

```sh
pnpm install
pnpm start
```

## Configuration

You can change :

-   The source fandom
-   The source of the page containing the register of all pages
-   The name of the subfolder to be created in `out/`
-   The name of the file containing the scrapped page content
-   the name of the file containing the history of links present on the wiki.

```js
// Base url of some wiki : https://some-wiki.fandom.com without '/' at end.
const from = "https://jujutsu-kaisen.fandom.com";

// https://some-wiki.fandom.com/wiki/Special:AllPages or https://some-wiki.fandom.com/fr/wiki/Sp%C3%A9cial:Toutes_les_pages
const entry_point_from_all_pages =
    "https://jujutsu-kaisen.fandom.com/fr/wiki/Sp%C3%A9cial:Toutes_les_pages?from=30%C3%A8me+Amicale+Inter%C3%A9coles";

// Name of your sub dir of out (Default: some-wiki relative to "from" variable).
const sub_dir = new URL(from).hostname.split(".")[0];

// Name of your datas filename.
const filename_data = `${sub_dir}-data`;

// Name of your history filename.
const filename_history = `${sub_dir}-history`;
```
