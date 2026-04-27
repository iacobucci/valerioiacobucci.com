import fs from 'fs';
import path from 'path';

// We import the JSON statically only to let Turbopack/Webpack track it for HMR in development.
// In production, we ignore this and read from the filesystem to allow runtime updates.
import projectsDataHMR from '../../content/projects.json';

export interface Project {
	title: string;
	github_repo: string;
	website_url?: string;
	tech: string[];
	selected?: boolean;
}

export type { Project as ProjectType };

export interface ProjectGitHubData extends Project {
	description: string;
	stars: number;
	forks: number;
	commits: number;
	last_commit: string;
	github_url: string;
	language?: string;
	error?: string;
}

// In-memory cache for projects.json (Production only)
let cachedProjects: Project[] | null = null;
let lastProjectsMtime: number = 0;

/**
 * Loads projects from JSON file with in-memory caching and HMR support.
 */
export function getProjects(): Project[] {
	// In development, return the imported data to enable HMR.
	// Turbopack will automatically refresh the components when projects.json changes.
	if (process.env.NODE_ENV === 'development') {
		return projectsDataHMR;
	}

	try {
		const projectsPath = path.join(process.cwd(), 'content', 'projects.json');
		const stats = fs.statSync(projectsPath);
		const mtime = stats.mtimeMs;

		// Return cache if file hasn't changed
		if (cachedProjects && mtime === lastProjectsMtime) {
			return cachedProjects;
		}

		const fileContent = fs.readFileSync(projectsPath, 'utf8');
		cachedProjects = JSON.parse(fileContent);
		lastProjectsMtime = mtime;
		return cachedProjects!;
	} catch (error) {
		console.error('Error reading projects.json:', error);
		return cachedProjects || [];
	}
}

// In-memory cache for GitHub data
const projectsCache: Record<string, Partial<ProjectGitHubData>> = {};
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
			description: data.description ?? '',
			stars: data.stargazers_count,
			forks: data.forks_count,
			github_url: data.html_url,
			language: data.language,
			last_commit: data.pushed_at
		};
	} catch (error) {
		console.error(`Error fetching GitHub data for ${repo}:`, error);
		return {
			description: '',
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
				description: githubData.description ?? '',
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
				description: githubData.description ?? '',
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
