import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import createMDX from '@next/mdx';

const withNextIntl = createNextIntlPlugin();
const withMDX = createMDX({
	extension: /\.mdx?$/,
});

const nextConfig: NextConfig = {
	reactCompiler: true,
	pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
	devIndicators: false,
	allowedDevOrigins: ['msi', 'valerioiacobucci.com'],
};

export default withNextIntl(withMDX(nextConfig));
