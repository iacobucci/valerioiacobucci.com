import React from 'react';

interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src?: string;
  sources?: { src: string; type: string }[];
  assetPath?: string;
  version?: string | number;
}

export const Video: React.FC<VideoProps> = ({ src, sources, assetPath, version, children, className, ...props }) => {
  const resolvePath = (path: string) => {
    if (!path || path.startsWith('http') || path.startsWith('/') || path.startsWith('data:')) {
      return path;
    }
    const normalized = path.startsWith('./') ? path.slice(2) : path;
    const fullPath = `${assetPath}/${normalized}`;
    return version ? `${fullPath}?v=${version}` : fullPath;
  };

  const finalSrc = src ? resolvePath(src) : undefined;
  const finalSources = sources?.map(s => ({
    ...s,
    src: resolvePath(s.src)
  }));

  return (
    <video
      className={className || "w-full rounded-lg my-8"}
      playsInline
      preload="metadata"
      {...props}
      src={finalSrc}
    >
      {finalSources?.map((s, i) => (
        <source key={i} src={s.src} type={s.type} />
      ))}
      {children}
    </video>
  );
};

export default Video;
