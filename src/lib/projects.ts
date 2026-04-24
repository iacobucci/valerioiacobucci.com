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

export const projects: Project[] = [
	{
		title: 'valerioiacobucci.com',
		description: 'My personal portfolio and blog built with Next.js.',
		github_repo: 'iacobucci/valerioiacobucci.com',
		tech: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Postgresql'],
		selected: true
	},
	{
		title: 'Spl',
		description: 'A simple parser library in C.',
		github_repo: 'iacobucci/spl',
		tech: ['C', 'Parsing'],
		selected: true
	},
	{
		title: 'Lispv',
		description: 'A didactic lisp-like language that compiles to rv32i assembly.',
		website_url: 'https://valerioiacobucci.com/apps/lispv',
		github_repo: 'iacobucci/lispv',
		tech: ['Lisp', 'Compiler', "RISC-V"],
		selected: true
	},
	{
		title: "Cloudformation Nuxt on Lambda",
		description: "Boilerplate for a Github Actions workflow that zips the app's build, pushes it to an S3 bucket, creates a Cloudformation stack comprising of an AWS Lambda for serverless side rendering a Nuxt app that connects via TypeORM to an Aurora instance behind a Proxy for connection pooling.",
		github_repo: "iacobucci/cfn-nuxt-typeorm-lambda-aurora",
		tech: ["Vue", "AWS", "CI/CD", "Serverless"],
		selected: true
	},
	{
		title: 'Call of duty - flappy bird 2k25',
		description: 'Unethical flappy bird with realistic graphics...',
		website_url: 'https://valerioiacobucci.com/apps/flappy/index.html',
		github_repo: 'iacobucci/call-of-duty-flappy-bird-2k25',
		tech: ['Typescript', 'Videogames'],
	},
	{
		title: "Cloudformation Nuxt on Ecs",
		description: "Boilerplate for a Github Actions workflow that builds the apps image, pushes it on an ECR, creates a Cloudformation stack comprising of AWS ECS tasks for server side rendering a Nuxt app that connects via TypeORM to an RDS instance.",
		github_repo: "iacobucci/cfn-nuxt-typeorm-ecs-rds",
		tech: ["Vue", "AWS", "CI/CD", "Load balancing"],
	},
	{
		title: 'Digit Recognizer',
		description: 'Micrograd-based neural network that communicates via grpc with p5.js frontend for inputting handwritten digits',
		github_repo: 'iacobucci/digit-recognizer',
		tech: ['Machine Learning']
	},
	{
		title: 'Bstow',
		description: 'A better (for some usecases) GNU Stow',
		github_repo: 'iacobucci/bstow',
		tech: ['GNU']
	},
	{
		title: 'Rstow',
		description: 'A quicker rewrite of bstow',
		github_repo: 'iacobucci/rstow',
		tech: ['GNU']
	},
	{
		title: 'Split our bills bot',
		description: 'A Telegram bot to split the bills!',
		github_repo: "iacobucci/split-our-bills-bot",
		tech: ['Python', 'Telegram']
	},
	{
		title: 'Run or raise',
		description: 'A Firefox extension. When opening an url, if it is already opened, raise the old tab. Else open a new one. You can set a list of websites that will follow this behaviour. This all works best when launching shortcuts.',
		github_repo: "iacobucci/run-or-raise",
		website_url: "https://addons.mozilla.org/en-US/firefox/addon/run-or-raise/",
		tech: ['Firefox', "Extension"]
	},
	{
		title: 'Iot Server',
		description: 'A simple iot server for my nas, built with FastAPI.',
		github_repo: 'iacobucci/iot-server',
		tech: ['IoT']
	},
	{
		title: 'Launchpad Daemon',
		description: 'A low impact linux daemon for using a Novation Launchpad to launch scripts',
		github_repo: 'iacobucci/launchpad-daemon',
		tech: ['Midi', 'IoT']
	},
	{
		title: 'Vscode adwaita theme',
		description: 'VS Code theme for the GNOME desktop updated for GNOME-48+\'s new #222226 based theme',
		github_repo: 'iacobucci/vscode-adwaita',
		tech: ['Css', 'Themes']
	},
	{
		title: 'Sviluppo Web in JS',
		description: 'Educational resources for web development in JavaScript.',
		github_repo: 'iacobucci/sviluppo-web-in-js',
		tech: ['JavaScript', 'Education']
	},
	{
		title: 'Mermarpidsome',
		description: 'Mermaid integration with Marp, with Fontawesome icons!',
		github_repo: "iacobucci/mermarpidsome",
		tech: ['JavaScript', 'Markdown']
	},
	{
		title: 'Blender addon to open project directory',
		description: 'Opens the directory of your current .blend file.',
		github_repo: "iacobucci/blender-open-containing-directory-addon",
		tech: ['Blender', "Extension"]
	},
	{
		title: "Pwdshort",
		description: "Shortens your pwd, tries to do it faster than a shell script with sed, cut and pipes :)",
		github_repo: "iacobucci/pwdshort",
		tech: ["Zsh"]
	},
	{
		title: "Automaton",
		description: 'Elementary cellular automaton generator in python',
		github_repo: "iacobucci/automaton",
		tech: ['Automata']
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
