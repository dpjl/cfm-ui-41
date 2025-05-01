import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Folder, ImageIcon, Files, Copy, Fingerprint } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { useLanguage } from '@/hooks/use-language';
import { MediaFilter } from '@/components/AppSidebar';
import { useDynamicFilters } from '@/hooks/use-dynamic-filters';
import { Skeleton } from '@/components/ui/skeleton';

interface FilterOptionsProps {
  selectedFilter: MediaFilter;
  onFilterChange: (filter: MediaFilter) => void;
}

const FilterOptions: React.FC<FilterOptionsProps> = ({
  selectedFilter,
  onFilterChange,
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { filters, isLoading } = useDynamicFilters();

  // Map des icônes par nom
  const iconMap: Record<string, React.ReactNode> = {
    'Folder': <Folder className="h-3 w-3" />,
    'ImageIcon': <ImageIcon className="h-3 w-3" />,
    'Copy': <Copy className="h-3 w-3" />,
    'Fingerprint': <Fingerprint className="h-3 w-3" />,
    'Files': <Files className="h-3 w-3" />
  };

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-1.5 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-6 w-20" />
        ))}
      </div>
    );
  }

  // Traduire les labels des filtres
  const translatedFilters = filters?.map(filter => ({
    ...filter,
    label: t(filter.label.toLowerCase().replace(/\s+/g, '_'))
  }));

  return (
    <div className="flex flex-wrap gap-1.5 mb-1">
      {translatedFilters?.map((filter) => (
        <Badge
          key={filter.id}
          variant={selectedFilter === filter.id ? "default" : "outline"}
          className={cn(
            "cursor-pointer transition-colors py-1 px-2", 
            selectedFilter === filter.id 
              ? "bg-primary hover:bg-primary/90" 
              : "hover:bg-primary/10 hover:text-primary-foreground"
          )}
          onClick={() => onFilterChange(filter.id as MediaFilter)}
        >
          <span className="flex items-center gap-1">
            {filter.icon && iconMap[filter.icon]}
            <span className={isMobile ? "text-[10px]" : "text-xs"}>
              {filter.label}
            </span>
          </span>
        </Badge>
      ))}
    </div>
  );
};

export default FilterOptions;
