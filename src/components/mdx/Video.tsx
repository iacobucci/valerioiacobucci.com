import React from 'react';

interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src?: string;
  sources?: { src: string; type: string }[];
  assetPath?: string;
}

export const Video: React.FC<VideoProps> = ({ src, sources, assetPath, children, className, ...props }) => {
  const resolvePath = (path: string) => {
    if (!path || path.startsWith('http') || path.startsWith('/') || path.startsWith('data:')) {
      return path;
    }
    const normalized = path.startsWith('./') ? path.slice(2) : path;
    return `${assetPath}/${normalized}`;
  };

  const finalSrc = src ? resolvePath(src) : undefined;
  const finalSources = sources?.map(s => ({
    ...s,
    src: resolvePath(s.src)
  }));

  return (
    <video className={className || "w-full rounded-lg my-8"} {...props} src={finalSrc}>
      {finalSources?.map((s, i) => (
        <source key={i} src={s.src} type={s.type} />
      ))}
      {children}
    </video>
  );
};

export default Video;
