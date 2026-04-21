export async function getPostMDX(slug: string, locale: string) {
	try {
		// Try requested locale
		const mod = await import(
			`@/../content/blog/${slug}/${locale}.mdx`
		);
		return { content: mod, isFallback: false };
	} catch (e) {
		// If requested locale is not English, try English as fallback
		if (locale !== 'en') {
			try {
				const mod = await import(
					`@/../content/blog/${slug}/en.mdx`
				);
				return { content: mod, isFallback: true };
			} catch (fallbackError) {
				console.error(`Error importing fallback MDX: content/blog/${slug}/en.mdx`, fallbackError);
				return null;
			}
		}
		
		console.error(`Error importing MDX: content/blog/${slug}/${locale}.mdx`, e);
		return null;
	}
}
