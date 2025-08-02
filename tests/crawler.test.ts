/**
 * This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course.
 * � Copyright Utrecht University (Department of Information and Computing Sciences)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import Crawler from '../src/Crawler';

describe('Crawler', () => {
	let crawler: Crawler;
	let repo: any;

	beforeAll(async () => {
	crawler = new Crawler(process.env.GITHUB_ACCESS_TOKEN || '', 100, 5);

	// Provide a valid query string (e.g., repos with 1000+ stars pushed recently)
	const query = 'stars:>=1000 pushed:>2024-01-01';
	
	// Fetch repos with the query
	const repos = await crawler.getRepos(1, query);

	// Use the first repo for testing
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

			console.log(JSON.stringify(metadata, null, 2));

			// Check structure
			expect(metadata).toHaveProperty('versionTime');
			expect(metadata).toHaveProperty('versionHash');
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
