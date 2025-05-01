import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TranslationKey } from '@/types/gallery';

// Étendre le contexte pour les nouvelles traductions
interface LanguageContextType {
  language: string;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
  t: (key: TranslationKey) => string;
}

const translations: Record<string, Record<TranslationKey, string>> = {
  en: {
    'date': 'Date',
    'size': 'Size',
    'camera': 'Camera',
    'path': 'Path',
    'hash': 'Hash',
    'duplicates': 'Duplicates',
    'noMediaFound': 'No media found',
    'noDirectories': 'No directories found',
    'media_gallery': 'Media Gallery',
    'too_many_items_to_select': 'Too many items selected. Please select less than 1000.',
    'close_sidebars': 'Close Sidebars',
    'columns': 'Columns',
    'single_selection': 'Single Selection',
    'multiple_selection': 'Multiple Selection',
    'desktop_columns': 'Desktop Columns',
    'desktop_single_columns': 'Desktop Columns (Single)',
    'split_columns': 'Split Columns',
    'single_columns': 'Single Columns',
    'delete_confirmation_title': 'Delete Confirmation',
    'delete_confirmation_description': 'Are you sure you want to delete the selected items?',
    'deleting': 'Deleting...',
    'select_all': 'Select All',
    'deselect_all': 'Deselect All',
    'hide_dates': 'Hide Dates',
    'show_dates': 'Show Dates',
    'selected': 'Selected',
    'refresh': 'Refresh',
    'delete': 'Delete',
    'cancel': 'Cancel',
    'errorLoadingMedia': 'Error loading media',
    'select_date': 'Select Date',
    'year': 'Year',
    'month': 'Month',
    'january': 'January',
    'february': 'February', 
    'march': 'March',
    'april': 'April',
    'may': 'May',
    'june': 'June',
    'july': 'July',
    'august': 'August',
    'september': 'September',
    'october': 'October',
    'november': 'November',
    'december': 'December',
    'delete_confirmation_message': 'This action will move the selected items to the trash located in the CFM application cache.',
    'directories': 'Directories',
    'files': 'Files',
    'last_execution': 'Last Execution',
    'all': 'All',
    'unique': 'Without duplicates',
    'only_here': 'Only here',
    'common': 'Common',
    'common_copied': 'Common (copied)',
    'common_identical': 'Common (identical)',
    'only_here_conflicted': 'Only here (conflicted)',
    'source': 'Source:',
    'destination': 'Destination:',
    'files_unit': 'files',
    'delete_success_message': 'The selected media files have been moved to the trash',
    'month_january': 'January',
    'month_february': 'February',
    'month_march': 'March',
    'month_april': 'April',
    'month_may': 'May',
    'month_june': 'June',
    'month_july': 'July',
    'month_august': 'August',
    'month_september': 'September',
    'month_october': 'October',
    'month_november': 'November',
    'month_december': 'December',
    'media_info': 'Media Info',
    'close': 'Close',
    'loading': 'Loading...',
    'error_loading_media': 'Failed to load media info',
    'filename': 'Filename',
    'created': 'Created',
    'preview': 'Preview',
    'download': 'Download'
  },
  fr: {
    'date': 'Date',
    'size': 'Taille',
    'camera': 'Appareil photo',
    'path': 'Chemin',
    'hash': 'Hash',
    'duplicates': 'Doublons',
    'noMediaFound': 'Aucun média trouvé',
    'noDirectories': 'Aucun répertoire trouvé',
    'media_gallery': 'Galerie Médias',
    'too_many_items_to_select': 'Trop d\'éléments sélectionnés. Veuillez sélectionner moins de 1000.',
    'close_sidebars': 'Fermer les panneaux latéraux',
    'columns': 'Colonnes',
    'single_selection': 'Sélection unique',
    'multiple_selection': 'Sélection multiple',
    'desktop_columns': 'Colonnes (Bureau)',
    'desktop_single_columns': 'Colonnes (Bureau, Simple)',
    'split_columns': 'Colonnes (Divisé)',
    'single_columns': 'Colonnes (Simple)',
    'delete_confirmation_title': 'Confirmation de suppression',
    'delete_confirmation_description': 'Êtes-vous sûr de vouloir supprimer les éléments sélectionnés ?',
    'deleting': 'Suppression...',
    'select_all': 'Tout sélectionner',
    'deselect_all': 'Tout désélectionner',
    'hide_dates': 'Masquer les dates',
    'show_dates': 'Afficher les dates',
    'selected': 'Sélectionnés',
    'refresh': 'Actualiser',
    'delete': 'Supprimer',
    'cancel': 'Annuler',
    'errorLoadingMedia': 'Erreur de chargement des médias',
    'select_date': 'Sélectionner une date',
    'year': 'Année',
    'month': 'Mois',
    'january': 'Janvier',
    'february': 'Février', 
    'march': 'Mars',
    'april': 'Avril',
    'may': 'Mai',
    'june': 'Juin',
    'july': 'Juillet',
    'august': 'Août',
    'september': 'Septembre',
    'october': 'Octobre',
    'november': 'Novembre',
    'december': 'Décembre',
    'delete_confirmation_message': 'Cette action déplacera les éléments sélectionnés dans la corbeille située dans le cache de l\'application CFM.',
    'directories': 'Répertoires',
    'files': 'Fichiers',
    'last_execution': 'Dernière exécution',
    'all_media': 'Tous les médias',
    'no_duplicates': 'Sans doublons',
    'unique_to_gallery': 'Uniques à la galerie',
    'in_both_galleries': 'Dans les deux galeries',
    'never_executed': 'Jamais exécuté',
    'source': 'Source :',
    'destination': 'Destination :',
    'files_unit': 'fichiers',
    'delete_success_message': 'Les fichiers médias sélectionnés ont été déplacés dans la corbeille',
    'month_january': 'Janvier',
    'month_february': 'Février',
    'month_march': 'Mars',
    'month_april': 'Avril',
    'month_may': 'Mai',
    'month_june': 'Juin',
    'month_july': 'Juillet',
    'month_august': 'Août',
    'month_september': 'Septembre',
    'month_october': 'Octobre',
    'month_november': 'Novembre',
    'month_december': 'Décembre',
    'media_info': 'Informations média',
    'close': 'Fermer',
    'loading': 'Chargement...',
    'error_loading_media': 'Erreur de chargement des informations média',
    'filename': 'Nom du fichier',
    'created': 'Créé le',
    'preview': 'Aperçu',
    'download': 'Télécharger'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(localStorage.getItem('language') || 'fr');

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = useCallback((key: TranslationKey) => {
    return translations[language][key] || translations['en'][key] || key;
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
