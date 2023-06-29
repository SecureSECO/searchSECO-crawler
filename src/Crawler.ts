/**
 * This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course.
 * � Copyright Utrecht University (Department of Information and Computing Sciences)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from 'octokit';

export interface ProjectMetadata {
	id: number;
	versionTime: string;
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

	constructor(token: string, repoPerPage = 100, maxRepos = 5) {
		this.octo = new Octokit({ auth: token });
		this.repoPerPage = repoPerPage;
		this.maxRepos = maxRepos;
	}

	/**
	 * Return repos based on the query.
	 * @param page Page number to get repos from
	 */
	public async getRepos(page: number): Promise<any> {
		return await this.octo.request('GET /search/repositories', {
			q: 'fork: false', // Replace with an actual query? Maybe date?
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
		const URLImportanceList: Array<{
			url: string;
			importance: number;
			finalProjectId: number;
		}> = [];
		const languages: LanguageCount = {};

		let page = 1;
		let finalProjectId = 0;

		let totalProcessedRepos = 0;
		while (totalProcessedRepos < this.maxRepos) {
			try {
				const repos = await this.getRepos(page);
				//console.log(repos.data.items);
				if (repos.data.items.length === 0) break;
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
				page++;
			} catch (e) {
				console.log(e);
				break;
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

		if (typeof project === 'string') {
			const [, _owner, _repo] = project.replace('https://', '').split('/');
			owner = _owner;
			repo = _repo;
		} else {
			owner = project.owner.login;
			repo = project.name;
		}

		const { data } = await this.octo.rest.repos.get({
			owner,
			repo,
		});

		const commitData = await this.octo.rest.repos.getCommit({
			owner,
			repo,
			ref: data.default_branch,
		});

		const userData = await this.octo.rest.users.getByUsername({
			username: data.owner.login,
		});

		const metadata: ProjectMetadata = {
			id: data.id,
			versionTime: new Date(data.pushed_at).getTime().toString(),
			versionHash: commitData.data.sha,
			license: data.license ? data.license.name : '',
			name: data.name,
			url: data.html_url,
			authorName: data.owner.login,
			authorMail: userData.data.email || '',
			defaultBranch: data.default_branch,
		};

		return metadata;
	}
}
