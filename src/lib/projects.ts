import projectsData from '../../content/projects.json';

export interface Project {
	title: string;
	description: string;
	github_repo: string;
	website_url?: string;
	tech: string[];
	selected?: boolean;
}

export type { Project as ProjectType };

export interface ProjectGitHubData extends Project {
	stars: number;
	forks: number;
	commits: number;
	last_commit: string;
	github_url: string;
	language?: string;
	error?: string;
}

/**
 * Loads projects from YAML file.
 */
export function getProjects(): Project[] {
	return projectsData;
}

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
		const isExpired = Date.now() - lastFetchTime > CACHE_TTL;
		if (!isExpired) {
			return projectsCache[repo];
		}
	}

	const data = await fetchGitHubData(repo);
	projectsCache[repo] = data;
	lastFetchTime = Date.now();
	return data;
}

/**
 * Gets all projects with their GitHub data.
 */
export async function getProjectsWithGitHubData(): Promise<ProjectGitHubData[]> {
	const projects = getProjects();
	const projectsWithData = await Promise.all(
		projects.map(async (project) => {
			const githubData = await getGitHubData(project.github_repo);
			return {
				...project,
				...githubData,
				// Ensure required fields from ProjectGitHubData are present
				stars: githubData.stars ?? 0,
				forks: githubData.forks ?? 0,
				commits: githubData.commits ?? 0,
				last_commit: githubData.last_commit ?? '',
				github_url: githubData.github_url ?? `https://github.com/${project.github_repo}`
			} as ProjectGitHubData;
		})
	);

	return projectsWithData;
}

/**
 * Gets selected projects with their GitHub data.
 */
export async function getSelectedProjects(): Promise<ProjectGitHubData[]> {
	const projects = getProjects();
	const selectedProjects = projects.filter(p => p.selected);
	
	const projectsWithData = await Promise.all(
		selectedProjects.map(async (project) => {
			const githubData = await getGitHubData(project.github_repo);
			return {
				...project,
				...githubData,
				stars: githubData.stars ?? 0,
				forks: githubData.forks ?? 0,
				commits: githubData.commits ?? 0,
				last_commit: githubData.last_commit ?? '',
				github_url: githubData.github_url ?? `https://github.com/${project.github_repo}`
			} as ProjectGitHubData;
		})
	);

	return projectsWithData;
}
