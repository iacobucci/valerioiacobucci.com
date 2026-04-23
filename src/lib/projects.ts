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
}

export const projects: Project[] = [
	{
		slug: 'valerioiacobucci-com',
		title: '',
		description: '',
		github_repo: 'iacobucci/valerioiacobucci.com',
		website_url: 'https://valerioiacobucci.com',
		tech: ['Nuxt', 'Vue', 'TypeScript', 'Tailwind CSS']
	},
	{
		slug: 'spl',
		title: '',
		description: '',
		github_repo: 'iacobucci/spl',
		tech: ['C', 'Parsing']
	},
	{
		slug: 'lispv',
		title: '',
		description: '',
		github_repo: 'iacobucci/lispv',
		tech: ['Lisp', 'Compiler', "RISC-V"]
	},
	{
		slug: 'digit-recognizer',
		title: '',
		description: '',
		github_repo: 'iacobucci/digit-recognizer',
		tech: ['C++', 'Machine Learning', 'Neural Networks']
	},
	{
		slug: 'sviluppo-web-in-js',
		title: '',
		description: '',
		github_repo: 'iacobucci/sviluppo-web-in-js',
		tech: ['JavaScript', 'Education', 'Web Development']
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
				// In production we should use a GITHUB_TOKEN to avoid rate limits
				...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {})
			},
			next: { revalidate: 3600 }
		});
		
		if (!res.ok) {
			console.error(`Failed to fetch data for ${repo}: ${res.statusText}`);
			return {};
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
		return {};
	}
}

/**
 * Gets GitHub data for a specific repo, serving from cache if available.
 */
export async function getGitHubData(repo: string): Promise<Partial<ProjectGitHubData>> {
	const now = Date.now();
	
	// If cache is expired or empty, we could trigger a refresh
	// But to avoid blocking this request, we serve what we have 
	// and check if we need to refresh the whole set elsewhere
	if (projectsCache[repo]) {
		return projectsCache[repo];
	}

	// Fallback to fresh fetch if not in cache (should only happen once)
	const data = await fetchGitHubData(repo);
	projectsCache[repo] = data;
	return data;
}

/**
 * Returns all projects with their cached GitHub data.
 * Triggers a background refresh if the cache is stale.
 */
export async function getAllProjectsWithData(): Promise<ProjectGitHubData[]> {
	const now = Date.now();
	
	// Check if cache needs background refresh
	if (now - lastFetchTime > CACHE_TTL) {
		// Non-blocking refresh
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
