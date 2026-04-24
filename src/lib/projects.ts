import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface Project {
	title: string;
	description: string;
	github_repo: string; // e.g., 'iacobucci/spl'
	website_url?: string;
	tech: string[];
	selected?: boolean;
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

/**
 * Loads projects from YAML file.
 */
export function getProjects(): Project[] {
	const projectsPath = path.join(process.cwd(), 'content/projects.yaml');
	const fileContents = fs.readFileSync(projectsPath, 'utf8');
	return yaml.load(fileContents) as Project[];
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
	const projects = getProjects();

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
	const projects = getProjects();

	for (const project of projects) {
		newData[project.github_repo] = await fetchGitHubData(project.github_repo);
	}

	projectsCache = newData;
	lastFetchTime = Date.now();
	console.log("Projects GitHub cache refreshed.");
}
