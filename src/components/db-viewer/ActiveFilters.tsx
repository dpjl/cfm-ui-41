
import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilterCondition, FilterRequest } from '@/hooks/use-db-viewer';

interface ActiveFiltersProps {
  filter: FilterRequest;
  removeFilterCondition: (index: number) => void;
  setFilterLogic: (logic: 'and' | 'or') => void;
  columns: {
    key: string;
    label: string;
    type: string;
  }[];
}

// Fonction pour convertir un opérateur en texte lisible
const getOperatorText = (operator: string): string => {
  const operatorMap: Record<string, string> = {
    eq: 'égal à',
    neq: 'différent de',
    gt: 'supérieur à',
    lt: 'inférieur à',
    gte: 'supérieur ou égal à',
    lte: 'inférieur ou égal à',
    contains: 'contient',
    startsWith: 'commence par',
    endsWith: 'se termine par',
    between: 'entre'
  };
  
  return operatorMap[operator] || operator;
};

// Fonction pour formater une valeur selon son type
const formatFilterValue = (condition: FilterCondition): string => {
  const { value, operator } = condition;
  
  if (operator === 'between' && Array.isArray(value)) {
    return `${value[0]} et ${value[1]}`;
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Vrai' : 'Faux';
  }
  
  return String(value);
};

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filter,
  removeFilterCondition,
  setFilterLogic,
  columns
}) => {
  // Si aucun filtre actif, ne rien afficher
  if (filter.conditions.length === 0) {
    return null;
  }
  
  // Trouver le libellé de colonne pour chaque condition
  const getColumnLabel = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    return column?.label || columnKey;
  };
  
  return (
    <div className="py-2 px-4 bg-muted/40 rounded-md mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Filtres actifs</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`text-xs h-7 ${filter.logic === 'and' ? 'bg-secondary' : ''}`}
            onClick={() => setFilterLogic('and')}
          >
            ET
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`text-xs h-7 ${filter.logic === 'or' ? 'bg-secondary' : ''}`}
            onClick={() => setFilterLogic('or')}
          >
            OU
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {filter.conditions.map((condition, index) => (
          <Badge 
            key={index} 
            variant="secondary"
            className="pl-2 pr-1 py-1 flex items-center gap-1"
          >
            <span className="text-xs">
              {getColumnLabel(condition.column)} {getOperatorText(condition.operator)} {formatFilterValue(condition)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 rounded-full ml-1"
              onClick={() => removeFilterCondition(index)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Supprimer le filtre</span>
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ActiveFilters;
