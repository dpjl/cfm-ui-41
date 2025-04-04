
import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FilterOperator, FilterCondition } from '@/hooks/use-db-viewer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Filter } from 'lucide-react';

interface ColumnFilterPopoverProps {
  column: {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'image';
  };
  addFilterCondition: (condition: FilterCondition) => void;
  existingCondition?: FilterCondition;
  onRemove?: () => void;
}

// Opérateurs disponibles par type de données
const operatorsByType: Record<string, { value: FilterOperator; label: string }[]> = {
  text: [
    { value: 'eq', label: 'Est égal à' },
    { value: 'neq', label: 'N\'est pas égal à' },
    { value: 'contains', label: 'Contient' },
    { value: 'startsWith', label: 'Commence par' },
    { value: 'endsWith', label: 'Termine par' }
  ],
  number: [
    { value: 'eq', label: 'Est égal à' },
    { value: 'neq', label: 'N\'est pas égal à' },
    { value: 'gt', label: 'Supérieur à' },
    { value: 'lt', label: 'Inférieur à' },
    { value: 'gte', label: 'Supérieur ou égal à' },
    { value: 'lte', label: 'Inférieur ou égal à' },
    { value: 'between', label: 'Entre' }
  ],
  date: [
    { value: 'eq', label: 'Est égal à' },
    { value: 'neq', label: 'N\'est pas égal à' },
    { value: 'gt', label: 'Après le' },
    { value: 'lt', label: 'Avant le' },
    { value: 'between', label: 'Entre' }
  ],
  boolean: [
    { value: 'eq', label: 'Est' }
  ],
  image: [
    { value: 'contains', label: 'Nom contient' }
  ]
};

const ColumnFilterPopover: React.FC<ColumnFilterPopoverProps> = ({
  column,
  addFilterCondition,
  existingCondition,
  onRemove
}) => {
  // État initial basé sur une condition existante ou des valeurs par défaut
  const [operator, setOperator] = useState<FilterOperator>(
    existingCondition?.operator || (operatorsByType[column.type][0]?.value)
  );
  
  const [value, setValue] = useState<any>(
    existingCondition?.value ?? ''
  );
  
  const [value2, setValue2] = useState<any>(
    Array.isArray(existingCondition?.value) ? existingCondition.value[1] : ''
  );
  
  const [isOpen, setIsOpen] = useState(false);
  
  // Gestionnaire d'ajout de filtre
  const handleApplyFilter = () => {
    const condition: FilterCondition = {
      column: column.key,
      operator,
      value: operator === 'between' ? [value, value2] : value
    };
    
    addFilterCondition(condition);
    setIsOpen(false);
  };
  
  // Obtenir les opérateurs disponibles pour ce type de colonne
  const availableOperators = operatorsByType[column.type] || operatorsByType.text;
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`h-6 w-6 p-0 opacity-70 hover:opacity-100 ${existingCondition ? 'text-primary' : ''}`}
        >
          <Filter className="h-3.5 w-3.5" />
          <span className="sr-only">Filtrer {column.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filtrer par {column.label}</h4>
            {existingCondition && onRemove && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => {
                  onRemove();
                  setIsOpen(false);
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Supprimer le filtre</span>
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`operator-${column.key}`}>Opérateur</Label>
            <Select 
              value={operator} 
              onValueChange={(value) => setOperator(value as FilterOperator)}
            >
              <SelectTrigger id={`operator-${column.key}`}>
                <SelectValue placeholder="Sélectionner un opérateur" />
              </SelectTrigger>
              <SelectContent>
                {availableOperators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`value-${column.key}`}>Valeur</Label>
            {column.type === 'boolean' ? (
              <Select 
                value={String(value)} 
                onValueChange={(v) => setValue(v === 'true')}
              >
                <SelectTrigger id={`value-${column.key}`}>
                  <SelectValue placeholder="Sélectionner une valeur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Vrai</SelectItem>
                  <SelectItem value="false">Faux</SelectItem>
                </SelectContent>
              </Select>
            ) : column.type === 'date' ? (
              <Input 
                id={`value-${column.key}`}
                type="date" 
                value={typeof value === 'string' ? value : ''} 
                onChange={(e) => setValue(e.target.value)}
              />
            ) : (
              <Input 
                id={`value-${column.key}`}
                type={column.type === 'number' ? 'number' : 'text'} 
                value={typeof value === 'string' || typeof value === 'number' ? value : ''} 
                onChange={(e) => {
                  const val = column.type === 'number' ? parseFloat(e.target.value) : e.target.value;
                  setValue(val);
                }}
                placeholder={`Entrer une valeur pour ${column.label}`}
              />
            )}
          </div>
          
          {operator === 'between' && (
            <div className="space-y-2">
              <Label htmlFor={`value2-${column.key}`}>Deuxième valeur</Label>
              {column.type === 'date' ? (
                <Input 
                  id={`value2-${column.key}`}
                  type="date" 
                  value={typeof value2 === 'string' ? value2 : ''} 
                  onChange={(e) => setValue2(e.target.value)}
                />
              ) : (
                <Input 
                  id={`value2-${column.key}`}
                  type={column.type === 'number' ? 'number' : 'text'} 
                  value={typeof value2 === 'string' || typeof value2 === 'number' ? value2 : ''} 
                  onChange={(e) => {
                    const val = column.type === 'number' ? parseFloat(e.target.value) : e.target.value;
                    setValue2(val);
                  }}
                  placeholder={`Entrer une deuxième valeur`}
                />
              )}
            </div>
          )}
          
          <Button 
            className="w-full" 
            onClick={handleApplyFilter}
            disabled={
              value === '' || 
              (operator === 'between' && value2 === '')
            }
          >
            Appliquer le filtre
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColumnFilterPopover;
