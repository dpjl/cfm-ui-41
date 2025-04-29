import React, { useState, useEffect } from 'react';
import { Server, RefreshCw, Folder, Files, Calendar, FileText, X } from 'lucide-react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from '@/components/ui/drawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { fetchServerStatus } from '@/api/serverApi';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { useTheme } from '@/hooks/use-theme';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLanguage } from '@/hooks/use-language';

interface ServerStatus {
  isAccessible: boolean;
  sourceDirectory: string;
  destinationDirectory: string;
  sourceFileCount: number;
  destinationFileCount: number;
  lastExecutionDate: string | null;
  destinationFormat: string;
}

interface ServerStatusPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ServerStatusPanel: React.FC<ServerStatusPanelProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const getServerStatus = async () => {
    try {
      setIsLoading(true);
      const data = await fetchServerStatus();
      setStatus(data);
      setError(null);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch server status:', err);
      setError('Unable to connect to server');
      setStatus({
        isAccessible: false,
        sourceDirectory: '—',
        destinationDirectory: '—',
        sourceFileCount: 0,
        destinationFileCount: 0,
        lastExecutionDate: null,
        destinationFormat: '—'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      getServerStatus();
    }
    const intervalId = isOpen ? setInterval(getServerStatus, 30000) : null;
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen]);

  const triggerRefresh = () => {
    getServerStatus();
  };

  const getLastRefreshedText = () => {
    if (!lastRefreshed) return 'Jamais';
    
    const now = new Date();
    const diffMs = now.getTime() - lastRefreshed.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return `il y a ${diffSec} sec`;
    if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`;
    
    return format(lastRefreshed, isMobile ? 'HH:mm' : 'HH:mm:ss', { locale: fr });
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              <DrawerTitle>État du Serveur</DrawerTitle>
              <Badge 
                variant={status?.isAccessible ? "success" : "destructive"}
                className="text-[0.65rem] h-5"
              >
                {status?.isAccessible ? 'En ligne' : 'Hors ligne'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <DrawerDescription className="m-0">
                Dernière actualisation: {getLastRefreshedText()}
              </DrawerDescription>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={triggerRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              </Button>
              <DrawerClose className="h-7 w-7 rounded-md border flex items-center justify-center hover:bg-secondary">
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Fermer</span>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>
        
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="p-4">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-4/5" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ServerInfoCard
                icon={<Folder className="h-4 w-4" />}
                title={t('directories')}
                items={[
                  { label: t('source'), value: status?.sourceDirectory || '—' },
                  { label: t('destination'), value: status?.destinationDirectory || '—' }
                ]}
              />
              
              <ServerInfoCard
                icon={<Files className="h-4 w-4" />}
                title={t('files')}
                items={[
                  { label: t('source'), value: `${status?.sourceFileCount.toLocaleString() || '0'} ${t('files_unit')}` },
                  { label: t('destination'), value: `${status?.destinationFileCount.toLocaleString() || '0'} ${t('files_unit')}` }
                ]}
              />
              
              <ServerInfoCard
                icon={<Calendar className="h-4 w-4" />}
                title={t('last_execution')}
                items={[
                  {
                    label: '',
                    value: status?.lastExecutionDate 
                      ? format(new Date(status.lastExecutionDate), 
                          isMobile ? 'dd/MM/yy HH:mm' : 'dd MMMM yyyy HH:mm:ss', 
                          { locale: fr })
                      : t('never_executed')
                  }
                ]}
              />
              
              <ServerInfoCard
                icon={<FileText className="h-4 w-4" />}
                title="Configuration"
                items={[
                  { label: 'Format:', value: status?.destinationFormat || '—' }
                ]}
              />
            </div>
          )}
        </div>
        
        <DrawerFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {status?.isAccessible 
                  ? 'Le serveur fonctionne normalement'
                  : 'Le serveur est actuellement indisponible'}
              </p>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

interface ServerInfoCardProps {
  icon: React.ReactNode;
  title: string;
  items: Array<{ label: string; value: string }>;
}

const ServerInfoCard: React.FC<ServerInfoCardProps> = ({ icon, title, items }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-3 text-xs">
              {item.label && (
                <span className="text-muted-foreground">{item.label}</span>
              )}
              <span className={cn(
                "font-mono truncate",
                item.label ? "col-span-2" : "col-span-3"
              )} title={item.value}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServerStatusPanel;
