import { Crawler } from "../Crawler";

describe('Crawler', () => {
    let crawler: Crawler;
    let repo: any;

    beforeAll(async () => {
        crawler = new Crawler(process.env.GITHUB_ACCESS_TOKEN || "", 100, 5);

        // Fetch some repos for testing
        const repos = await crawler.getRepos(1);
        // Use first repo for testing
        repo = repos.data.items[0];
    });

    describe('crawlData', () => {
        it('should retrieve the crawl data (global) successfully', async () => {
            const crawlData = await crawler.crawl();

            // Check structure
            expect(crawlData).toHaveProperty('URLImportanceList');
            expect(crawlData).toHaveProperty('languages');
            expect(crawlData).toHaveProperty('finalProjectId');

            // Check if we have data
            expect(crawlData.URLImportanceList.length).toBeGreaterThan(0);
        }, 30000);
    });

    describe('getProjectMetadata', () => {
        it('should retrieve the project metadata (per repo) successfully', async () => {
            const metadata = await crawler.getProjectMetadata(repo);

            // Check structure
            expect(metadata).toHaveProperty('version');
            expect(metadata).toHaveProperty('license');
            expect(metadata).toHaveProperty('name');
            expect(metadata).toHaveProperty('url');
            expect(metadata).toHaveProperty('authorName');
            expect(metadata).toHaveProperty('authorMail');
            expect(metadata).toHaveProperty('defaultBranch');

            // Check if we have data
            expect(metadata.name).toEqual(repo.name);
        }, 30000);
    });
});
