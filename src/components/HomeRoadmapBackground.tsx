'use client';

import { useEffect, useState } from 'react';

export default function HomeRoadmapBackground() {
	const [mounted, setMounted] = useState(false);
	const [isDesktop, setIsDesktop] = useState(false);

	useEffect(() => {
		setMounted(true);
		const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
		checkDesktop();
		window.addEventListener('resize', checkDesktop);
		return () => window.removeEventListener('resize', checkDesktop);
	}, []);

	// On desktop (>=1024px), scale is 2x: 1440x1080. Icons grid becomes 180px.
	// On smaller screens, scale is 1x: 720x540. Icons grid is 90px.
	const scale = isDesktop ? 2 : 1;
	const patternWidth = 720 * scale;
	const patternHeight = 540 * scale;
	const gridStep = 90 * scale;

	const bgStyle = {
		maskImage: 'url("/assets/background.svg")',
		WebkitMaskImage: 'url("/assets/background.svg")',
		maskRepeat: 'repeat',
		WebkitMaskRepeat: 'repeat',
		maskSize: `${patternWidth}px ${patternHeight}px`,
		WebkitMaskSize: `${patternWidth}px ${patternHeight}px`,
		maskPosition: 'center top',
		WebkitMaskPosition: 'center top',
		// Clip the container to the nearest grid increment from the top
		clipPath: `inset(0 0 calc(100% - round(down, 100%, ${gridStep}px)) 0)`,
		WebkitClipPath: `inset(0 0 calc(100% - round(down, 100%, ${gridStep}px)) 0)`,
		// Continuous horizontal scroll
		animation: `roadmap-scroll 60s linear infinite`,
	} as React.CSSProperties;

	return (
		<div 
			className={`absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}
			aria-hidden="true"
		>
			<style>{`
				@keyframes roadmap-scroll {
					from { mask-position: 0px top; -webkit-mask-position: 0px top; }
					to { mask-position: -${patternWidth}px top; -webkit-mask-position: -${patternWidth}px top; }
				}
			`}</style>
			<div 
				className="absolute inset-0 bg-gray-900 dark:bg-white opacity-[0.08] dark:opacity-[0.05]"
				style={bgStyle}
			/>
		</div>
	);
}
