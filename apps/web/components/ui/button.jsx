import { cn } from '@/lib/utils';

const variantClass = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors duration-150',
  // outline: 'border border-input bg-background text-black hover:bg-primary  hover:text-white transition-colors duration-150',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors duration-150',
  ghost: 'hover:bg-accent hover:text-accent-foreground transition-colors duration-150',
  link: 'text-primary underline-offset-4 hover:underline transition-colors duration-150',
  gradientOrange: 'bg-gradient-to-r from-[#ffa84f] to-[#fe9400] font-semibold text-[#231000] hover:opacity-90 transition-colors duration-150',
  outline: 'border border-input bg-background text-black hover:bg-gradient-to-r hover:from-[#ffa84f] hover:to-[#fe9400] hover:text-white hover:opacity-90 transition-colors duration-150',
  
};

const sizeClass = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
};

export function Button({
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    />
  );
}
