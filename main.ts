
import { Crawler } from "./Crawler";


(() => {
    const crawler = new Crawler(process.env.GITHUB_ACCESS_TOKEN || "")

    console.log("Crawler is operational.")
})()