// Renommer MobileViewMode en GalleryViewMode pour plus de cohérence
export type GalleryViewMode = 'both' | 'left' | 'right';

// ViewModeType est utilisé pour les calculs de colonnes
export type ViewModeType = 'desktop' | 'desktop-single' | 'mobile-split' | 'mobile-single';

// Basic media item interface
export interface MediaItem {
  id: string;
  src?: string;
  alt?: string;
  createdAt?: string;
  isVideo?: boolean;
  directory?: string;
  type?: "image" | "video";
}

// Structure optimisée pour la réponse API: { [date: string]: string[] }
export type MediaIdsByDate = { [date: string]: string[] };

// Structure de la réponse API pour les listes de médias avec leurs dates
export interface MediaListResponse {
  mediaIds: string[];
  mediaDates: string[];
}

// Nouveau type pour représenter soit un média, soit un séparateur
export type GalleryItem = 
  | { type: 'media'; id: string; index: number; actualIndex?: number }
  | { type: 'separator'; yearMonth: string; label: string; index: number };

// Ensure all translation keys are properly typed
export type TranslationKey = 
  | 'date' | 'size' | 'camera' | 'path' | 'hash' | 'duplicates'
  | 'noMediaFound' | 'noDirectories'
  | 'media_gallery' | 'too_many_items_to_select' | 'close_sidebars'
  | 'columns' | 'single_selection' | 'multiple_selection'
  | 'desktop_columns' | 'desktop_single_columns' | 'split_columns' | 'single_columns'
  | 'delete_confirmation_title' | 'delete_confirmation_description' | 'deleting'
  | 'select_all' | 'deselect_all' | 'hide_dates' | 'show_dates' | 'selected' | 'refresh' | 'delete'
  | 'select_date' | 'year' | 'month' | 'january' | 'february' | 'march' | 'april' 
  | 'may' | 'june' | 'july' | 'august' | 'september' | 'october' | 'november' | 'december'
  | 'cancel' | 'errorLoadingMedia'; // Added missing translation keys
