import Analyzer from "./class/Analyzer.mjs";
import fs from "fs";
import path from "path";
import * as url from "url";

// Base url of some fandom's wiki ex: https://some-wiki.fandom.com without '/' at end.
const from = "https://dragonball.fandom.com";

// https://some-wiki.fandom.com/wiki/Special:AllPages or https://some-wiki.fandom.com/fr/wiki/Sp%C3%A9cial:Toutes_les_pages
const entry_point_from_all_pages =
    "https://dragonball.fandom.com/fr/wiki/Sp%C3%A9cial:Toutes_les_pages?from=10x+Kamehameha";

// Name of the subfolder to be created in out/ (Default: some-wiki relative to "from" variable).
const sub_dir = new URL(from).hostname.split(".")[0];

// Data file name.
const filename_data = `${sub_dir}-data`;

// History file name.
const filename_history = `${sub_dir}-history`;

const text_decorder = new TextDecoder();
const analyzer = new Analyzer(from);

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const out_dir = path.join(__dirname, "out");
const sub_out = path.join(out_dir, sub_dir);
if (!fs.existsSync(out_dir)) {
    fs.mkdirSync(out_dir);
    console.log("[+] out/ added.");
} else {
    console.log("[i] out/ aleardy exists. Skip");
}

const executeWithoutHistory = () => {
    analyzer.retrieveAllLinks(entry_point_from_all_pages).then((a) => {
        if (!fs.existsSync(sub_out)) {
            fs.mkdirSync(sub_out);
            console.log(`[+] out/${sub_dir}/ added.`);
        } else {
            console.log(`[i] out/${sub_dir}/ aleardy exists. Skip`);
        }

        const history_out = path.join(sub_out, filename_history);
        fs.writeFileSync(history_out, JSON.stringify(a));

        console.log(`[+] ${a.length} links loaded in ${history_out}.`);

        analyzer.finalTask().then((b) => {
            const data_out = path.join(sub_out, filename_data);
            fs.writeFileSync(data_out, JSON.stringify(b));

            console.log(
                `[<] ${b.length} texts retreive from url contains in ${data_out}.`
            );
        });
    });
};

/**
 * Launch code with already existing history links
 * @param {[]} history The history
 */
const executeWithHistory = (history) => {
    analyzer.setList(history);

    analyzer.finalTask().then((a) => {
        const data_out = path.join(sub_out, filename_data);
        fs.writeFileSync(data_out, JSON.stringify(a));

        console.log(
            `[<] ${a.length} texts retreive from url contains in ${data_out}.`
        );
    });
};

const some_history = path.join(out_dir, sub_dir, filename_history);

if (fs.existsSync(some_history)) {
    console.log("[>] Starting operations with history...");
    const history = fs.readFileSync(some_history);
    const history_text = JSON.parse(text_decorder.decode(history));
    executeWithHistory(history_text);
} else {
    console.log("[>] Starting operations without history...");
    executeWithoutHistory();
}
