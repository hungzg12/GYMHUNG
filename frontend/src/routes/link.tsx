import { forwardRef, type ComponentProps } from 'react';
import { Link as RouterLink } from 'react-router-dom';
export default forwardRef<HTMLAnchorElement, ComponentProps<'a'>>(function Link({href = '/', ...props}, ref) {
  return <RouterLink ref={ref} to={href} {...props} />;
});
