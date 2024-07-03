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
            return text.replace(/[\s\n\t\r\\]+/g, " ").trim();
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
    async retrieveAllTextsFrom(url, process = null) {
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
            !link.match(/[#.](png|svg|jpg|jpeg)$/i) &&
            !link.match(/Fil:|Utilisateur:|Utilisatrice:/)
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

            const superior_authority = this;

            while (!isFinish) {
                const { data } = await axios.get(current_url);
                const $ = cheerio.load(data);

                $("ul > li > a").each(function (index, element) {
                    const href = $(element).attr("href");

                    if (superior_authority.linkIsFullyConform(href)) {
                        const final_push = href.startsWith("/fr/wiki/")
                            ? `${superior_authority.base}${href}`
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
                        next = `${superior_authority.base}${theorical_next[i].attribs.href}`;
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
        let total = 0;

        for (let epoch = 0; epoch < (limit || this.list.length); epoch++) {
            const url = this.list[epoch];

            const content = await this.retrieveAllTextsFrom(
                url,
                `(${epoch + 1}/${this.list.length})`
            );

            if (content) {
                contents.push(content);
                total += content.content.length;
            }
        }

        console.log(`[i] Retrieved ${total} characters.`);
        return contents;
    }
}
