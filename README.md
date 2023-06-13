# SearchSECO-Crawler

The Crawler, a key component of the SearchSECO project, is designed for identifying
relevant projects for further processing. It operates by exploring code repositories
and returning URLs, which are subsequently processed by the Spider. In
addition, the Crawler retrieves crucial metadata related to each project, such as
the project owner's name and email.

## Functionality

The primary responsibilities of the Crawler are:

- Identifying Repositories: The Crawler finds repositories by querying GitHub,
  sorted by the number of stars, and excluding forks. It collects a specified
  number of repositories per page, and continues this process over a certain
  number of pages.

- Crawling Repositories: For each found repository, the Crawler fetches the
  repository's URL, its importance (currently determined by the star count), and
  a unique ID. The Crawler also fetches the programming languages used in each
  repository, to better facilitate the process of categorizing and processing projects.

- Fetching Project Metadata: For each repository, the Crawler extracts valuable
  metadata including the project's ID, last updated time, latest commit hash,
  license, name, URL, owner's username, owner's email (if publicly available),
  and default branch.

## Usage

The Spider primarily serves as a submodule within the Miner. For detailed 
instructions on integrating and utilizing the Spider in your system, please refer 
to the [SearchSECO Miner documentation](https://github.com/SecureSECODAO/searchSECO-miner).

## License

This project is licensed under the MIT license. See [LICENSE](/LICENSE) for more info.

This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course. © Copyright Utrecht University (Department of Information and Computing Sciences)
