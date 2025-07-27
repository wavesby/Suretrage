import { memo } from 'react';
import { Code, Sparkles } from 'lucide-react';

interface WatermarkProps {
  position?: 'fixed' | 'absolute' | 'relative';
  className?: string;
  variant?: 'minimal' | 'decorative' | 'footer';
}

const WatermarkComponent = ({ 
  position = 'fixed', 
  className = '', 
  variant = 'minimal' 
}: WatermarkProps) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'fixed':
        return 'fixed bottom-2 right-2 z-10';
      case 'absolute':
        return 'absolute bottom-2 right-2';
      default:
        return '';
    }
  };

  const getVariantContent = () => {
    switch (variant) {
      case 'decorative':
        return (
          <div className="group flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-muted-foreground/90 transition-all duration-300 watermark-hover">
            <div className="relative">
              <Code className="w-3 h-3 group-hover:rotate-12 transition-transform duration-300" />
              <Sparkles className="absolute -top-1 -right-1 w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-accent" />
            </div>
            <span className="font-medium tracking-wide">
              Developed by{' '}
              <span className="text-gradient font-semibold watermark-glow">
                mwaveslimited
              </span>
            </span>
          </div>
        );
      case 'footer':
        return (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/70 py-4 watermark-hover">
            <div className="flex items-center gap-1">
              <Code className="w-4 h-4" />
              <span>Crafted with ❤️ by</span>
              <span className="text-gradient font-semibold watermark-glow">mwaveslimited</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-xs text-muted-foreground/50 hover:text-muted-foreground/80 transition-all duration-300 watermark-hover">
            <span className="opacity-60">by </span>
            <span className="text-gradient font-medium watermark-glow">mwaves</span>
          </div>
        );
    }
  };

  return (
    <div className={`${getPositionClasses()} ${className} select-none pointer-events-none`}>
      {getVariantContent()}
    </div>
  );
};

export const Watermark = memo(WatermarkComponent);
export default Watermark; 