import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Folder, ImageIcon, Files, Copy, Fingerprint } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { useLanguage } from '@/hooks/use-language';
import { MediaFilter } from '@/components/AppSidebar';

interface FilterOption {
  id: MediaFilter;
  label: string;
  icon: React.ReactNode;
}

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

  // Filter options with simpler labels
  const filterOptions: FilterOption[] = [
    { 
      id: 'all', 
      label: t('all_media'),
      icon: <Folder className="h-3 w-3" />
    },
    { 
      id: 'unique', 
      label: t('no_duplicates'),
      icon: <ImageIcon className="h-3 w-3" />
    },
    { 
      id: 'duplicates', 
      label: t('duplicates'),
      icon: <Copy className="h-3 w-3" />
    },
    { 
      id: 'exclusive', 
      label: t('unique_to_gallery'),
      icon: <Fingerprint className="h-3 w-3" />
    },
    { 
      id: 'common', 
      label: t('in_both_galleries'),
      icon: <Files className="h-3 w-3" />
    }
  ];

  return (
    <div className="flex flex-wrap gap-1.5 mb-1">
      {filterOptions.map((option) => (
        <Badge
          key={option.id}
          variant={selectedFilter === option.id ? "default" : "outline"}
          className={cn(
            "cursor-pointer transition-colors py-1 px-2", 
            selectedFilter === option.id 
              ? "bg-primary hover:bg-primary/90" 
              : "hover:bg-primary/10 hover:text-primary-foreground"
          )}
          onClick={() => onFilterChange(option.id)}
        >
          <span className="flex items-center gap-1">
            {option.icon}
            <span className={isMobile ? "text-[10px]" : "text-xs"}>
              {option.label}
            </span>
          </span>
        </Badge>
      ))}
    </div>
  );
};

export default FilterOptions;
