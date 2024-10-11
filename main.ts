/**
 * This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course.
 * � Copyright Utrecht University (Department of Information and Computing Sciences)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

//import Crawler from './src/Crawler';
import Crawler, { CrawlData, ProjectMetadata } from './src/Crawler';

(() => {
	console.log('Crawler is operational.');
})();

async function test1() {
	let token = process.env.GITHUB_TOKEN;
	if (!token) {
		process.exitCode=1;
	} else {
	    let c = new Crawler(token);
	    let metadata = await c.getProjectMetadata('https://github.com/zeromq/libzmq');
	    console.log(JSON.stringify(metadata));
	    let repos = await c.crawl();
	    console.log(JSON.stringify(repos));
	    process.exitCode=0;
	}
}

test1();


