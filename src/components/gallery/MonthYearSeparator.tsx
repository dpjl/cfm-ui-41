import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-media-query';
interface MonthYearSeparatorProps {
  label: string;
}
const MonthYearSeparator: React.FC<MonthYearSeparatorProps> = ({
  label
}) => {
  // Extraire le mois et l'année du label (ex: "Janvier 2023")
  const parts = label.split(' ');
  const month = parts[0];
  const year = parts[1] || '';
  const isMobile = useIsMobile();

  // Déterminer si nous devons afficher une version abrégée du mois sur mobile
  const displayMonth = useMemo(() => {
    if (isMobile && month.length > 4) {
      // Abréger les mois longs sur mobile (3 premiers caractères)
      return month.substring(0, 3) + '.';
    }
    return month;
  }, [month, isMobile]);
  return <motion.div initial={{
    opacity: 0,
    scale: 0.95
  }} animate={{
    opacity: 1,
    scale: 1
  }} transition={{
    duration: 0.3
  }} key={`${month}-${year}`} // Ajouter une clé spécifique pour forcer l'animation à chaque changement
  className="flex items-center justify-center w-full h-full p-1 sm:p-2 px-0 py-0">
      <div className="relative flex flex-col items-center justify-center bg-muted/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-1 sm:p-2 w-[95%] h-[95%] shadow-subtle border border-muted/30 overflow-hidden group">
        {/* Fond du calendrier avec dégradé subtil */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 to-transparent opacity-50 group-hover:opacity-70 transition-opacity"></div>
        
        {/* En-tête du calendrier */}
        <div className="absolute top-0 left-0 right-0 h-[30%] bg-sky-500/30 dark:bg-sky-500/20 group-hover:bg-sky-500/40 transition-colors rounded-t-lg"></div>
        
        {/* Icône de calendrier en arrière-plan légèrement transparente */}
        <div className="absolute opacity-15 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Calendar className="w-8 h-8 md:w-10 md:h-10 text-sky-600/60 dark:text-sky-400/60" strokeWidth={1.5} />
        </div>
        
        {/* Texte du mois et de l'année - texte adaptatif */}
        <div className="z-10 flex flex-col items-center justify-center text-center">
          <span className="text-[0.6rem] xs:text-xs sm:text-sm font-medium text-foreground/80">
            {displayMonth}
          </span>
          <span className="text-sm xs:text-base sm:text-lg font-bold text-foreground">
            {year}
          </span>
        </div>

        {/* Effet de brillance au survol */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000 ease-in-out"></div>
      </div>
    </motion.div>;
};
export default MonthYearSeparator;