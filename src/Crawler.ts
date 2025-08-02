/**
 * This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course.
 * � Copyright Utrecht University (Department of Information and Computing Sciences)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from 'octokit';
import { promisify } from 'util';
import { exec } from 'child_process';
import Logger, { Verbosity } from './searchSECO-logger/src/Logger';

const LANGUAGES = ['Python', 'JavaScript', 'Java', 'C++', 'C', 'C#'];

function getRandomInt(min: number, max: number): number {
	const minCeiled = Math.ceil(min);
	const maxFloored = Math.floor(max);
	return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

function msecToDateStr(time: number): string {
	return new Date(time).toISOString().substring(0, 10);
}

// Compute a random query for use in a Github api repository search.
// We choose a random language, range of stars and period of last push.
// The precise choices for the parameters are not thoroughly researched,
//  but rather random with a tiny bit of testing and intuition.
// For background, see
// https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories

function getQuery(): string {
	const MAXSTAR = 4000;
	const MAXDAYSBACK = 2000;
	const MSECINDAY = 1000 * 60 * 60 * 24;
	// The language of the repository
	let langIdx = getRandomInt(0, LANGUAGES.length);
	let lang = LANGUAGES[langIdx];
	// The number of stars the repository must have
	// We choose a relatively big chance for choosing a repository with maximum stars
	// namely 40/(MAXSTAR-201), about 1%
	let starsMax = getRandomInt(201, MAXSTAR + 40);
	let stars = starsMax >= MAXSTAR ? `>=${MAXSTAR}` : `${starsMax - 200}..${starsMax}`;
	// The date of the last push to the repository
	let maxTime = Date.now() - getRandomInt(0, MAXDAYSBACK) * MSECINDAY;
	let minTime = maxTime - 100 * MSECINDAY;
	let maxDate = msecToDateStr(maxTime);
	let minDate = msecToDateStr(minTime);
	let pushdates = `${minDate}..${maxDate}`;
	// Construct the query string
	let result = `stars:${stars} language:${lang} pushed:${pushdates}`;
	return result;
}

export interface ProjectMetadata {
	id: number;
	versionTime: number;
	versionHash: string;
	license: string;
	name: string;
	url: string;
	authorName: string;
	authorMail: string;
	defaultBranch: string;
}

export interface CrawlData {
	URLImportanceList: Array<{
		url: string;
		importance: number;
		finalProjectId: number;
	}>;
	languages: LanguageCount;
	finalProjectId: number;
}



interface LanguageCount {
	[key: string]: number;
}

export default class Crawler {
	private octo: Octokit;
	private repoPerPage: number;
	private maxRepos: number;

	constructor(token: string, repoPerPage = 100, maxRepos = 100) {
		this.octo = new Octokit({ auth: token });
		this.repoPerPage = repoPerPage;
		this.maxRepos = maxRepos;
	}

	/**
	 * Return repos based on the query.
	 * @param page Page number to get repos from
	 */
	// A repository_search_url looks like:
	// "https://api.github.com/search/repositories?q={query}{&page,per_page,sort,order}"
	// e.g: https://api.github.com/search/repositories?q=sort=stars&per_page=100&q=stars:3000..10000 pushed:>2023-08-27
	public async getRepos(page: number, query: string): Promise<any> {
		return await this.octo.request('GET /search/repositories', {
			q: query,
			sort: 'stars',
			order: 'desc',
			per_page: this.repoPerPage,
			page: page,
		});
	}






	private async getLanguages(url: string): Promise<LanguageCount> {
		const res = await this.octo.request(`GET ${url}`);
		return res.data;
	}

	/**
	 * Crawls per page, starting from page 1.
	 * Creates a list of repos containing the URL, importance, and project ID.
	 * Importance is currently measured as stargazer count.
	 */
	public async crawl(): Promise<CrawlData> {
		// console.log('in crawl');
		const URLImportanceList: Array<{
			url: string;
			importance: number;
			finalProjectId: number;
		}> = [];
		const languages: LanguageCount = {};




		let finalProjectId = 0;

		let totalProcessedRepos = 0;
		while (totalProcessedRepos < this.maxRepos) {
			let query = getQuery();
			// console.log(`query: ${query}`);
			let page = 1;
			while (totalProcessedRepos < this.maxRepos) {
				try {
					const repos = await this.getRepos(page, query);
					// console.log(`found ${repos.data.items.length} items`);

					totalProcessedRepos += repos.data.items.length;
					const promises = repos.data.items.map(async (repo: any) => {
						const url = repo.html_url;
						const importance = repo.stargazers_count;
						const projectId = repo.id;

						URLImportanceList.push({
							url,
							importance,
							finalProjectId: projectId,
						});
						finalProjectId = projectId;

						const repoLanguages = await this.getLanguages(repo.languages_url);
						for (const lang in repoLanguages) {
							languages[lang] = languages[lang] ? languages[lang] + 1 : 1;
						}
					});

					await Promise.all(promises);
					if (repos.data.items.length < this.repoPerPage) break;
					page++;
				} catch (e) {
					console.log(e);
					break;
				}
			}
		}

		return { URLImportanceList, languages, finalProjectId };
	}

	/**
	 * Retrieves metadata per repository.
	 * Version hash and author mail require extra requests.
	 * Author mail is only available if the user has made it public.
	 * @param repo Repository to extract data from
	 */
	public async getProjectMetadata(project: any): Promise<ProjectMetadata> {
		let owner = '';
		let repo = '';
		let url = '';

		if (typeof project === 'string') {
			[, owner, repo] = project.replace('https://', '').split('/');
			url = project;
		} else {
			owner = project.owner.login;
			repo = project.name;
			url = 'https://github.com/' + owner + '/' + repo;
		}

		const response = await this.octo.rest.repos.get({
			owner,
			repo,
		});
		if (response.status != 200) throw response

		const { data } = response
		const commitData = await this.octo.rest.repos.getCommit({
			owner,
			repo,
			ref: data.default_branch,
		});

		const userData = await this.octo.rest.users.getByUsername({
			username: data.owner.login,
		});
		let id = 0;
		let exec2 = promisify(exec);
		let { stdout, stderr } = await exec2(`seseco_pid1 ${url}`)
		id = Number(stdout);
		const metadata: ProjectMetadata = {
			id: id,
			versionTime: new Date(data.pushed_at).getTime(),
			versionHash: commitData.data.sha,
			license: data.license ? data.license.name : '',
			name: data.name,
			url: data.html_url,
			authorName: data.owner.login,
			authorMail: userData.data.email || '',
			defaultBranch: data.default_branch,
		};
		
		Logger.Info(`Project License Info: ${metadata.license}`, Logger.GetCallerLocation());

		return metadata;
	}
}
