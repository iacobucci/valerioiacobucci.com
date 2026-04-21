const extension = "mdx";

export async function getContentMDX(type: string, slug: string, locale: string) {
	try {
		// Try requested locale
		const mod = await import(
			`@/../content/${type}/${slug}/${locale}.${extension}`
		);
		return { content: mod, isFallback: false };
	} catch (e) {
		// If requested locale is not English, try English as fallback
		if (locale !== 'en') {
			try {
				const mod = await import(
					`@/../content/${type}/${slug}/en.${extension}`
				);
				return { content: mod, isFallback: true };
			} catch (fallbackError) {
				console.error(`Error importing fallback MDX: content/${type}/${slug}/en.${extension}`, fallbackError);
				return null;
			}
		}

		console.error(`Error importing MDX: content/${type}/${slug}/${locale}.${extension}`, e);
		return null;
	}
}

/**
 * @deprecated Use getContentMDX instead
 */
export async function getPostMDX(slug: string, locale: string) {
	return getContentMDX('blog', slug, locale);
}
