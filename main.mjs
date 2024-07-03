import Analyzer from "./class/Analyzer.mjs";
import fs from "fs";
import path from "path";
import * as url from "url";

// Base url of some fandom's wiki ex: https://some-wiki.fandom.com without '/' at end.
const from = "https://onepiece.fandom.com";

// https://some-wiki.fandom.com/wiki/Special:AllPages or https://some-wiki.fandom.com/fr/wiki/Sp%C3%A9cial:Toutes_les_pages
const entry_point_from_all_pages =
    "https://onepiece.fandom.com/fr/wiki/Sp%C3%A9cial:Toutes_les_pages?from=%22Gang%22+Bege%27s+Oh+my+family";

// Name of the subfolder to be created in out/ (Default: some-wiki relative to "from" variable).
const sub_dir = new URL(from).hostname.split(".")[0];

// Data file name.
const filename_data = `${sub_dir}-data.json`;

// History file name.
const filename_history = `${sub_dir}-history.json`;

const analyzer = new Analyzer(from);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const out_dir = path.join(__dirname, "out");
const sub_out = path.join(out_dir, sub_dir);

/**
 * Create output directories if they don't exist
 * @param {string} dir Path of future directory.
 */
const createDirectory = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        console.log(`[+] ${dir} added.`);
    } else {
        console.log(`[i] ${dir} already exists. Skip`);
    }
};

createDirectory(out_dir);
createDirectory(sub_out);

/**
 * Execute without history links
 */
const executeWithoutHistory = async () => {
    try {
        const links = await analyzer.retrieveAllLinks(
            entry_point_from_all_pages
        );
        const history_out = path.join(sub_out, filename_history);

        fs.writeFileSync(history_out, JSON.stringify(links));
        console.log(`[+] ${links.length} links loaded in ${history_out}.`);

        const texts = await analyzer.finalTask();
        const data_out = path.join(sub_out, filename_data);

        fs.writeFileSync(data_out, JSON.stringify(texts));
        console.log(
            `[<] ${texts.length} texts retrieved and saved to ${data_out}.`
        );
    } catch (err) {
        console.error(`[!] An error occurred: ${err.message}`);
    }
};

/**
 * Execute with existing history links
 * @param {Array} history The history
 */
const executeWithHistory = async (history) => {
    try {
        analyzer.setList(history);
        const texts = await analyzer.finalTask();
        const data_out = path.join(sub_out, filename_data);

        fs.writeFileSync(data_out, JSON.stringify(texts));
        console.log(
            `[<] ${texts.length} texts retrieved and saved to ${data_out}.`
        );
    } catch (err) {
        console.error(`[!] An error occurred: ${err.message}`);
    }
};

const some_history = path.join(sub_out, filename_history);

(async () => {
    if (fs.existsSync(some_history)) {
        console.log("[>] Starting operations with history...");
        const history = JSON.parse(fs.readFileSync(some_history, "utf-8"));
        await executeWithHistory(history);
    } else {
        console.log("[>] Starting operations without history...");
        await executeWithoutHistory();
    }
})();
