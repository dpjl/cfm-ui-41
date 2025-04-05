
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

interface MonthYearSeparatorProps {
  label: string;
}

const MonthYearSeparator: React.FC<MonthYearSeparatorProps> = ({ label }) => {
  // Extract month and year from label (e.g. "January 2023")
  const parts = label.split(' ');
  const month = parts[0];
  const year = parts[1] || '';
  
  const isMobile = useIsMobile();
  
  // Determine if we should display an abbreviated version of the month on mobile
  const displayMonth = useMemo(() => {
    if (isMobile && month.length > 4) {
      // Abbreviate long months on mobile (first 3 characters)
      return month.substring(0, 3) + '.';
    }
    return month;
  }, [month, isMobile]);

  return (
    <motion.div 
      className="calendar-separator-wrapper"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="calendar-separator-container">
        {/* Calendar background with subtle gradient */}
        <div className="calendar-separator-gradient"></div>
        
        {/* Calendar header */}
        <div className="calendar-separator-header"></div>
        
        {/* Calendar icon as background - slightly transparent */}
        <div className="calendar-separator-icon">
          <Calendar 
            className="text-sky-600/60 dark:text-sky-400/60" 
            strokeWidth={1.5} 
          />
        </div>
        
        {/* Month and year text - adaptive text */}
        <div className="calendar-separator-content">
          <span className="calendar-separator-month">
            {displayMonth}
          </span>
          <span className="calendar-separator-year">
            {year}
          </span>
        </div>

        {/* Shine effect on hover */}
        <div className="calendar-separator-shine"></div>
      </div>
    </motion.div>
  );
};

export default MonthYearSeparator;
