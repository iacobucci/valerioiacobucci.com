'use server';

import ogs from 'open-graph-scraper';

export interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  siteName?: string;
}

export async function getLinkPreviewAction(url: string): Promise<LinkPreviewData | null> {
  try {
    const options = { url, timeout: 5000 };
    const { result } = await ogs(options);

    if (!result.success) {
      return null;
    }

    return {
      title: result.ogTitle || result.twitterTitle,
      description: result.ogDescription || result.twitterDescription,
      image: Array.isArray(result.ogImage) ? result.ogImage[0]?.url : result.ogImage?.url,
      url: result.ogUrl || url,
      siteName: result.ogSiteName,
    };
  } catch (error) {
    console.error(`Failed to fetch OG data for ${url}:`, error);
    return null;
  }
}
