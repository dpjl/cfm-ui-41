
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CurrentMonthBannerProps {
  currentMonth: string | null;
  position: 'source' | 'destination';
}

const CurrentMonthBanner: React.FC<CurrentMonthBannerProps> = ({ 
  currentMonth,
  position
}) => {
  if (!currentMonth) return null;
  
  // Déterminer la classe de couleur en fonction de la position
  const colorClass = position === 'source' 
    ? 'bg-primary/80 text-primary-foreground' 
    : 'bg-secondary/80 text-secondary-foreground';
  
  return (
    <div className="sticky top-0 z-30 w-full py-0.5 px-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMonth}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`rounded-md py-1 px-3 text-center text-sm font-medium shadow-sm ${colorClass}`}
        >
          {currentMonth}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CurrentMonthBanner;
