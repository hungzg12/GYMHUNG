import type { ComponentProps } from 'react';
export default function Image({fill, unoptimized: _unoptimized, priority, alt = '', ...props}: ComponentProps<'img'> & {fill?: boolean; unoptimized?: boolean; priority?: boolean}) {
 return <img {...props} alt={alt} loading={priority ? 'eager' : 'lazy'} style={{...(fill ? {width:'100%',height:'100%',objectFit:'cover' as const} : {}),...props.style}} />;
}
