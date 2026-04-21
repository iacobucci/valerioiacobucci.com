const extension = "mdx";

export async function getPostMDX(slug: string, locale: string) {
	try {
		// Try requested locale
		const mod = await import(
			`@/../content/blog/${slug}/${locale}.${extension}`
		);
		return { content: mod, isFallback: false };
	} catch (e) {
		// If requested locale is not English, try English as fallback
		if (locale !== 'en') {
			try {
				const mod = await import(
					`@/../content/blog/${slug}/en.${extension}`
				);
				return { content: mod, isFallback: true };
			} catch (fallbackError) {
				console.error(`Error importing fallback MDX: content/blog/${slug}/en.${extension}`, fallbackError);
				return null;
			}
		}

		console.error(`Error importing MDX: content/blog/${slug}/${locale}.${extension}`, e);
		return null;
	}
}
