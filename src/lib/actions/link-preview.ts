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

    // Defensive image extraction due to complex types in open-graph-scraper
    let imageUrl: string | undefined;
    const ogImage = result.ogImage;
    if (Array.isArray(ogImage) && ogImage.length > 0) {
      const firstImage = ogImage[0] as unknown as { url: string };
      imageUrl = firstImage?.url;
    } else if (ogImage && typeof ogImage === 'object') {
      const imageObj = ogImage as unknown as { url: string };
      imageUrl = imageObj.url;
    }

    return {
      title: result.ogTitle || result.twitterTitle,
      description: result.ogDescription || result.twitterDescription,
      image: imageUrl,
      url: result.ogUrl || url,
      siteName: result.ogSiteName,
    };
  } catch (error) {
    console.error(`Failed to fetch OG data for ${url}:`, error);
    return null;
  }
}
