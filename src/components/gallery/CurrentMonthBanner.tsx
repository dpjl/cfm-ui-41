
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/use-media-query';

interface CurrentMonthBannerProps {
  currentMonth: string | null;
  position: 'source' | 'destination';
}

const CurrentMonthBanner: React.FC<CurrentMonthBannerProps> = ({ 
  currentMonth,
  position
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (!currentMonth) return null;
  
  // Déterminer les classes de couleur en fonction de la position
  const colorClass = position === 'source' 
    ? 'bg-primary/60 text-primary-foreground border-primary/30' 
    : 'bg-secondary/60 text-secondary-foreground border-secondary/30';
  
  // Classes de base pour le bandeau
  const baseClasses = "backdrop-blur-sm font-medium shadow-sm z-50";
  
  // Classes responsives
  const sizeClasses = isMobile 
    ? "text-xs py-0.5 px-2" 
    : "text-sm py-1 px-3";
  
  return (
    <div className="absolute top-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMonth}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`rounded-full ${baseClasses} ${sizeClasses} ${colorClass} border`}
          style={{
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            maxWidth: isMobile ? '80%' : '50%',
          }}
        >
          {currentMonth}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CurrentMonthBanner;
