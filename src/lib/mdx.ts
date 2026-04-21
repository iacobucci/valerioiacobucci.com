export async function getPostMDX(slug: string, locale: string) {
	try {
		const mod = await import(
			`@/../content/blog/${slug}/${locale}.mdx`
		);

		return mod;
	} catch (e) {
		console.error(`Error importing MDX: content/blog/${slug}/${locale}.mdx`, e);
		return null;
	}
}
