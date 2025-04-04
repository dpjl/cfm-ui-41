
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronUp, ChevronDown, Database, Loader2 } from 'lucide-react';
import { Pagination } from './Pagination';
import ActiveFilters from './ActiveFilters';
import ColumnFilterPopover from './ColumnFilterPopover';
import { useDbViewer, FilterCondition } from '@/hooks/use-db-viewer';

interface DbViewerProps {
  dbViewerState: ReturnType<typeof useDbViewer>;
}

const DbViewer: React.FC<DbViewerProps> = ({ dbViewerState }) => {
  const {
    state,
    data,
    isLoading,
    isError,
    closeViewer,
    goToPage,
    setPageSize,
    setSorting,
    addFilterCondition,
    removeFilterCondition,
    setFilterLogic
  } = dbViewerState;
  
  // Fonction pour déterminer l'icône de tri pour la colonne
  const getSortIcon = (columnKey: string) => {
    if (!state.sort || state.sort.column !== columnKey) {
      return null;
    }
    
    return state.sort.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 ml-1" /> 
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };
  
  // Gérer le clic sur l'en-tête de colonne pour le tri
  const handleSortClick = (columnKey: string) => {
    if (!state.sort || state.sort.column !== columnKey) {
      setSorting(columnKey, 'asc');
    } else {
      const newDirection = state.sort.direction === 'asc' ? 'desc' : 'asc';
      setSorting(columnKey, newDirection);
    }
  };

  return (
    <Dialog open={state.isOpen} onOpenChange={(open) => !open && closeViewer()}>
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <DialogTitle>
                Visualiseur de base de données
                {state.position === 'source' ? ' (Source)' : ' (Destination)'}
              </DialogTitle>
            </div>
            <Button variant="outline" size="sm" onClick={closeViewer}>
              Fermer
            </Button>
          </div>
          <DialogDescription className="text-sm mt-1">
            Consultation des données {state.position === 'source' ? 'source' : 'destination'} du répertoire sélectionné
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          {/* Affichage des filtres actifs */}
          {data && (
            <ActiveFilters
              filter={state.filter}
              removeFilterCondition={removeFilterCondition}
              setFilterLogic={setFilterLogic}
              columns={data.columns}
            />
          )}
          
          {/* Tableau de données */}
          <div className="flex-1 overflow-auto border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Chargement des données...</span>
              </div>
            ) : isError ? (
              <div className="flex items-center justify-center h-full text-destructive">
                Une erreur est survenue lors du chargement des données.
              </div>
            ) : !data ? (
              <div className="flex items-center justify-center h-full">
                Aucune donnée disponible.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {data.columns.map((column) => (
                      <TableHead 
                        key={column.key}
                        className="relative group"
                      >
                        <div className="flex items-center">
                          <button
                            className="flex items-center hover:text-primary transition-colors"
                            onClick={() => handleSortClick(column.key)}
                          >
                            {column.label}
                            {getSortIcon(column.key)}
                          </button>
                          
                          <div className="ml-2">
                            <ColumnFilterPopover
                              column={column}
                              addFilterCondition={addFilterCondition}
                              existingCondition={
                                state.filter.conditions.find(
                                  (c: FilterCondition) => c.column === column.key
                                )
                              }
                              onRemove={() => {
                                const index = state.filter.conditions.findIndex(
                                  (c: FilterCondition) => c.column === column.key
                                );
                                if (index !== -1) {
                                  removeFilterCondition(index);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.length === 0 ? (
                    <TableRow>
                      <TableCell 
                        colSpan={data.columns.length} 
                        className="h-32 text-center"
                      >
                        Aucun résultat trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.data.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {data.columns.map((column) => (
                          <TableCell key={`${rowIndex}-${column.key}`}>
                            {column.type === 'boolean' ? (
                              row[column.key] ? 'Oui' : 'Non'
                            ) : column.type === 'date' ? (
                              new Date(row[column.key]).toLocaleDateString()
                            ) : (
                              String(row[column.key])
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
          
          {/* Pagination */}
          {data && (
            <div className="py-2 mt-2">
              <Pagination
                currentPage={data.currentPage}
                totalPages={data.totalPages}
                totalItems={data.totalItems}
                pageSize={state.pageSize}
                onPageChange={goToPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DbViewer;
