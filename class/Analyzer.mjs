import cheerio from "cheerio";
import axios from "axios";

export default class Analyzer {
    /**
     * Wiki analyzer
     * @param {string} base source url as "https://some-wiki.fandom.com" without '/' at the end.
     * @return {Analyzer}
     */
    constructor(base) {
        this.base = base;
        this.list = [];
        this.decoder = new TextDecoder();
    }

    /**
     * Remove all standard text formatters such as \t, \n etc...
     * @param {string} text Your text.
     * @return {string}
     */
    cleanText(text) {
        try {
            text = text.replace(/\s+/g, " ");
            text = text.replace(/[\n\t\r]/g, "");
            text = text.replace(/\\./g, "");
            return text;
        } catch (err) {
            console.error("[!] The text could not be cleaned");
        }
    }

    /**
     * Manually implement visit link history.
     * @param {Array<string>} list History of all links.
     */
    setList(list) {
        this.list = list;
    }

    /**
     * Take all texts contained in certain selectors to a specific url..
     * @param {string} url The url containing the data to be retrieved.
     * @param {number|null} process Research progress (really not compulsory).
     * @return {Promise<{url: String, content: String}>}
     */
    async retreiveAllTextsFrom(url, process = null) {
        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            const content_one = $("p").text().trim();
            const title = $(".mw-page-title-main").text().trim();
            const cleaned = this.cleanText(content_one);

            console.log(
                `[+] ${process ? process : ""} Retreived ${
                    cleaned.length
                } caracters from ${url}`
            );

            return { url, title, content: cleaned };
        } catch (err) {
            console.error(`[!] Page content ${url} could not be retrieved`);
        }
    }

    /**
     * Filtering links for which no retrieval is required.
     * @param {url} link Link to check.
     * @return {boolean}
     */
    linkIsFullyConform(link) {
        return (
            link &&
            link.includes("/fr/wiki/") &&
            !link.includes("#") &&
            !link.includes(".png") &&
            !link.includes(".svg") &&
            !link.includes(".jpg") &&
            !link.includes(".jpeg") &&
            !link.includes("Fil:") &&
            !link.includes("Utilisateur:") &&
            !link.includes("Utilisatrice:")
        );
    }

    /**
     * Recover all wiki links from the "All links" | "Toutes les pages" page.
     * @param {string} url First url.
     * @return {Promise<Array<string>>}
     */
    async retrieveAllLinks(url) {
        try {
            let current_url = url;
            let isFinish = false;
            let stock = new Set();

            const proto = this.linkIsFullyConform;
            const base = this.base;

            while (!isFinish) {
                const { data } = await axios.get(current_url);
                const $ = cheerio.load(data);

                $("ul > li > a").each(function (index, element) {
                    const href = $(element).attr("href");

                    if (proto(href)) {
                        const final_push = href.startsWith("/fr/wiki/")
                            ? `${base}${href}`
                            : href;

                        stock.add(final_push);
                    }
                });

                const theorical_next = $(".mw-allpages-nav > a");
                let next = null;

                for (let i = 0; i <= theorical_next.length - 1; ++i) {
                    if (
                        theorical_next[i].children[0].data.includes(
                            "Page suivante"
                        ) ||
                        theorical_next[i].children[0].data.includes("Next page")
                    ) {
                        next = `${this.base}${theorical_next[i].attribs.href}`;
                        break;
                    }
                }

                if (next) {
                    current_url = next;
                } else {
                    isFinish = true;
                }
            }

            this.list = Array.from(stock);

            return this.list;
        } catch (err) {
            console.error("[!] Links could not be retrieved");
        }
    }

    /**
     * Final process to retrieve all texts contained in history links.
     * @param {number | null} limit Maybe a limitation ?
     * @return {Promise<Array<{url: String, content: String}>>}
     */
    async finalTask(limit = null) {
        const contents = [];
        let epoch = 0;
        let total = 0;

        for (let url of this.list) {
            if (epoch === limit) {
                break;
            }

            const content = await this.retreiveAllTextsFrom(
                url,
                `(${epoch}/${this.list.length})`
            );

            if (content) {
                contents.push(content);
                total += content.content.length;
            }

            epoch++;
        }

        console.log(`[i] Retreive ${total} caracters.`);

        return contents;
    }
}
