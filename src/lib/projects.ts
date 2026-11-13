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
	isFork?: boolean;
}

export interface ProjectsData {
	sources: Project[];
	forks: Project[];
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
let cachedProjectsCategorized: { sources: Project[]; forks: Project[] } | null = null;
let lastProjectsMtime: number = 0;

export function parseProjectsData(data: any): { sources: Project[]; forks: Project[] } {
	if (Array.isArray(data)) {
		return {
			sources: data.map(p => ({ ...p, isFork: false })),
			forks: []
		};
	}
	if (data && typeof data === 'object') {
		const sources = (Array.isArray(data.sources) ? data.sources : []).map((p: any) => ({ ...p, isFork: false }));
		const forks = (Array.isArray(data.forks) ? data.forks : []).map((p: any) => ({ ...p, isFork: true }));
		return { sources, forks };
	}
	return { sources: [], forks: [] };
}

export function getProjectsCategorized(): { sources: Project[]; forks: Project[] } {
	if (process.env.NODE_ENV === 'development') {
		return parseProjectsData(projectsDataHMR);
	}

	try {
		const projectsPath = path.join(process.cwd(), 'content', 'projects.json');
		const stats = fs.statSync(projectsPath);
		const mtime = stats.mtimeMs;

		if (cachedProjectsCategorized && mtime === lastProjectsMtime) {
			return cachedProjectsCategorized;
		}

		const fileContent = fs.readFileSync(projectsPath, 'utf8');
		const parsed = JSON.parse(fileContent);
		cachedProjectsCategorized = parseProjectsData(parsed);
		lastProjectsMtime = mtime;
		return cachedProjectsCategorized;
	} catch (error) {
		console.error('Error reading projects.json:', error);
		return cachedProjectsCategorized || { sources: [], forks: [] };
	}
}

/**
 * Loads all projects (sources + forks) with in-memory caching and HMR support.
 */
export function getProjects(): Project[] {
	const { sources, forks } = getProjectsCategorized();
	return [...sources, ...forks];
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

		const result: Partial<ProjectGitHubData> = {
			title: data.name,
			description: data.description ?? '',
			stars: data.stargazers_count,
			forks: data.forks_count,
			github_url: data.html_url,
			language: data.language,
			last_commit: data.pushed_at
		};

		if (data.homepage) {
			result.website_url = data.homepage;
		}

		return result;
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
 * Gets a single project by its repo name, fetching from GitHub if needed.
 * Works for both projects in projects.json and any other GitHub repo.
 */
export async function getProjectByRepo(repo: string): Promise<ProjectGitHubData | null> {
	const projects = getProjects();
	const existingProject = projects.find(p => p.github_repo === repo);
	
	const githubData = await getGitHubData(repo);
	if (githubData.error && !existingProject) return null;

	return {
		// Defaults
		description: '',
		stars: 0,
		forks: 0,
		commits: 0,
		last_commit: '',
		github_url: `https://github.com/${repo}`,
		
		// GitHub Data
		...githubData,
		
		// Local config overrides
		...(existingProject || {}),
		
		// Computed / Fallback logic for complex fields
		title: existingProject?.title ?? githubData.title ?? repo.split('/').pop() ?? repo,
		tech: existingProject?.tech ?? (githubData.language ? [githubData.language] : []),
		github_repo: repo,
	} as ProjectGitHubData;
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
				// GitHub Data
				...githubData,
				// Local config overrides
				...project,
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
				// GitHub Data
				...githubData,
				// Local config overrides
				...project,
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
