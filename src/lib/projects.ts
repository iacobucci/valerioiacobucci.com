export interface Project {
	slug: string;
	title: string;
	description: string;
	github_repo: string; // e.g., 'iacobucci/spl'
	website_url?: string;
	tech: string[];
}

export interface ProjectGitHubData extends Project {
	stars: number;
	forks: number;
	commits: number;
	last_commit: string;
	github_url: string;
	language?: string;
	error?: string;
}

export const projects: Project[] = [
	{
		slug: 'valerioiacobucci-com',
		title: 'valerioiacobucci.com',
		description: 'My personal portfolio and blog built with Next.js.',
		github_repo: 'iacobucci/valerioiacobucci.com',
		website_url: 'https://valerioiacobucci.com',
		tech: ['Nuxt', 'Vue', 'TypeScript', 'Tailwind CSS']
	},
	{
		slug: 'lispv',
		title: 'Lispv',
		description: 'A didactic lisp-like language that compiles to rv32i assembly.',
		website_url: 'https://valerioiacobucci.com/apps/lispv',
		github_repo: 'iacobucci/lispv',
		tech: ['Lisp', 'Compiler', "RISC-V"]
	},
	{
		slug: 'call-of-duty-flappy-bird-2k25',
		title: 'Call of duty - flappy bird 2k25',
		description: 'Unethical flappy bird with realistic graphics...',
		website_url: 'https://valerioiacobucci.com/apps/flappy/index.html',
		github_repo: 'iacobucci/call-of-duty-flappy-bird-2k25',
		tech: ['Typescript', 'Videogames']
	},
	{
		slug: 'spl',
		title: 'Spl',
		description: 'A simple parser library in C.',
		github_repo: 'iacobucci/spl',
		tech: ['C', 'Parsing']
	},
	{
		slug: 'digit-recognizer',
		title: 'Digit Recognizer',
		description: 'Micrograd-based neural network that communicates via grpc with p5.js frontend for inputting handwritten digits',
		github_repo: 'iacobucci/digit-recognizer',
		tech: ['C++', 'Machine Learning', 'Neural Networks']
	},
	{
		slug: 'sviluppo-web-in-js',
		title: 'Sviluppo Web in JS',
		description: 'Educational resources for web development in JavaScript.',
		github_repo: 'iacobucci/sviluppo-web-in-js',
		tech: ['JavaScript', 'Education', 'Web Development']
	},
	{
		slug: "mermarpidsome",
		title: 'Mermarpidsome',
		description: 'Mermaid integration with Marp, with Fontawesome icons!',
		github_repo: "iacobucci/mermarpidsome",
		tech: ['JavaScript', 'Markdown']
	}
];

// In-memory cache for GitHub data
let projectsCache: Record<string, Partial<ProjectGitHubData>> = {};
let lastFetchTime = 0;
const CACHE_TTL = 3600 * 1000; // 1 hour in milliseconds

async function fetchGitHubData(repo: string): Promise<Partial<ProjectGitHubData>> {
	try {
		const res = await fetch(`https://api.github.com/repos/${repo}`, {
			headers: {
				'Accept': 'application/vnd.github.v3+json',
				...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {})
			},
			next: { revalidate: 3600 }
		});

		if (!res.ok) {
			console.error(`Failed to fetch data for ${repo}: ${res.statusText}`);
			return {
				github_url: `https://github.com/${repo}`,
				error: res.status === 403 ? 'Rate limit exceeded' : res.statusText
			};
		}

		const data = await res.json();

		return {
			stars: data.stargazers_count,
			forks: data.forks_count,
			github_url: data.html_url,
			language: data.language,
			last_commit: data.pushed_at
		};
	} catch (error) {
		console.error(`Error fetching GitHub data for ${repo}:`, error);
		return {
			github_url: `https://github.com/${repo}`,
			error: 'Network error'
		};
	}
}

/**
 * Gets GitHub data for a specific repo, serving from cache if available.
 */
export async function getGitHubData(repo: string): Promise<Partial<ProjectGitHubData>> {
	if (projectsCache[repo]) {
		return projectsCache[repo];
	}

	const data = await fetchGitHubData(repo);
	projectsCache[repo] = data;
	return data;
}

/**
 * Returns all projects with their cached GitHub data.
 */
export async function getAllProjectsWithData(): Promise<ProjectGitHubData[]> {
	const now = Date.now();

	if (now - lastFetchTime > CACHE_TTL) {
		refreshProjectsCache().catch(console.error);
	}

	return Promise.all(projects.map(async (project) => {
		const githubData = await getGitHubData(project.github_repo);
		return {
			...project,
			stars: githubData.stars || 0,
			forks: githubData.forks || 0,
			github_url: githubData.github_url || `https://github.com/${project.github_repo}`,
			language: githubData.language,
			last_commit: githubData.last_commit || '',
			commits: 0,
			error: githubData.error
		} as ProjectGitHubData;
	}));
}

async function refreshProjectsCache() {
	console.log("Refreshing projects GitHub cache...");
	const newData: Record<string, Partial<ProjectGitHubData>> = {};

	for (const project of projects) {
		newData[project.github_repo] = await fetchGitHubData(project.github_repo);
	}

	projectsCache = newData;
	lastFetchTime = Date.now();
	console.log("Projects GitHub cache refreshed.");
}
