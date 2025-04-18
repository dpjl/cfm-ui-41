import React, { useState, useCallback } from 'react';
import { Calendar, ChevronLeft } from 'lucide-react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';

interface DateSelectorProps {
  years: number[];
  monthsByYear: Map<number, number[]>;
  onSelectYearMonth: (year: number, month: number) => void;
  position: 'source' | 'destination';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  years,
  monthsByYear,
  onSelectYearMonth,
  position,
  open,
  onOpenChange
}) => {
  const { t } = useLanguage();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const handleSelectYear = useCallback((year: number) => {
    setSelectedYear(year);
  }, []);

  const handleSelectMonth = useCallback((month: number) => {
    if (selectedYear !== null) {
      onSelectYearMonth(selectedYear, month);
      setOpen(false);
      setSelectedYear(null);
    }
  }, [selectedYear, onSelectYearMonth, setOpen]);

  const handleBackToYears = useCallback(() => {
    setSelectedYear(null);
  }, []);

  const getMonthName = (month: number): string => {
    const monthNames = [
      t('january'), t('february'), t('march'), t('april'),
      t('may'), t('june'), t('july'), t('august'),
      t('september'), t('october'), t('november'), t('december')
    ];
    return monthNames[month - 1] || '';
  };

  // Determine button position class based on gallery position
  const buttonPositionClass = position === 'source' 
    ? "top-2 left-2" 
    : "top-2 right-2";

  return (
    <Drawer open={isOpen} onOpenChange={setOpen}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            {selectedYear !== null && (
              <Button variant="ghost" size="sm" onClick={handleBackToYears} className="p-1">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            {selectedYear !== null
              ? `${selectedYear} - ${t('select_date')}`
              : t('select_date')}
          </DrawerTitle>
        </DrawerHeader>
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {selectedYear === null ? (
            <div className="grid grid-cols-3 gap-2">
              {years.map(year => (
                <Button 
                  key={year} 
                  variant="outline"
                  onClick={() => handleSelectYear(year)}
                  className="h-14"
                >
                  {year}
                </Button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {monthsByYear.get(selectedYear)?.map(month => (
                <Button
                  key={month}
                  variant="outline"
                  onClick={() => handleSelectMonth(month)}
                  className="h-14"
                >
                  {getMonthName(month)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default DateSelector;
