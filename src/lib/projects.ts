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

export async function getGitHubData(repo: string): Promise<Partial<ProjectGitHubData>> {
	try {
		const res = await fetch(`https://api.github.com/repos/${repo}`, {
			next: { revalidate: 3600 } // Cache for 1 hour
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
