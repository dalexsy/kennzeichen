export type Language = 'de' | 'en';

export interface Translations {
  app_title: string;
  app_title_short: string;
  all_states: string;
  all_states_dative: string;
  seen: string;
  seen_question: string;
  already_seen: string;
  search_placeholder: string;
  no_plates_found: string;
  no_plates_available: string;
  search_hint: string;
  reset_filters: string;
  clear_all_filters: string;
  show_all: string;
  back: string;
  toggle_map: string;
  alphabetical_view: string;
  grouped_view: string;
  loading: string;
  loading_plates: string;
  mark_as_seen: string;
  seen_on: string;
  export_seen: string;
  import_seen: string;
  export_success: string;
  import_success: string;
  import_error: string;
  imported_count: string;
  skipped_count: string;
  jump_to_section: string;
  settings: string;
  language: string;
  german: string;
  english: string;
  theme: string;
  theme_system: string;
  theme_light: string;
  theme_dark: string;
  contact_label: string;
  contact_aria: string;
  error_occurred: string;
  stateNames: Record<string, string>;
}

export const translations: Record<Language, Translations> = {
  de: {
    app_title: 'Kennzeichen Deutschland',
    app_title_short: 'Kennzeichen',
    all_states: 'alle Staaten',
    all_states_dative: 'allen Staaten',
    seen: 'Gesehen',
    seen_question: 'Gesehen?',
    already_seen: 'Schon gesehen',
    search_placeholder: 'Suche nach Kennzeichen oder Stadt...',
    no_plates_found: 'Keine Kennzeichen gefunden für',
    no_plates_available: 'Keine Kennzeichen verfügbar',
    search_hint: 'Versuche weniger Buchstaben einzugeben oder überprüfe die Schreibweise.',
    reset_filters: 'Filter zurücksetzen',
    clear_all_filters: 'Alle Filter löschen',
    show_all: 'Alles zeigen',
    back: 'Schließen',
    toggle_map: 'Karte anzeigen/verbergen',
    alphabetical_view: 'Alphabetisch',
    grouped_view: 'Nach Bundesland',
    loading: 'Wird geladen',
    loading_plates: 'Kennzeichendaten werden geladen...',
    mark_as_seen: 'Als gesehen markieren',
    seen_on: 'Gesehen am',
    export_seen: 'Gesehene exportieren',
    import_seen: 'Gesehene importieren',
    export_success: 'Export erfolgreich',
    import_success: 'Import erfolgreich',
    import_error: 'Fehler beim Import',
    imported_count: 'Importiert',
    skipped_count: 'Übersprungen',
    jump_to_section: 'Zu Abschnitt springen',
    settings: 'Einstellungen',
    language: 'Sprache',
    german: 'Deutsch',
    english: 'English',
    theme: 'Design',
    theme_system: 'System',
    theme_light: 'Hell',
    theme_dark: 'Dunkel',
    contact_label: 'Kontakt',
    contact_aria: 'E-Mail an Daryl',
    error_occurred: 'Ein Fehler ist aufgetreten',
    stateNames: {
      'Baden-Württemberg': 'Baden-Württemberg',
      Bayern: 'Bayern',
      Berlin: 'Berlin',
      Brandenburg: 'Brandenburg',
      Bremen: 'Bremen',
      Hamburg: 'Hamburg',
      Hessen: 'Hessen',
      'Mecklenburg-Vorpommern': 'Mecklenburg-Vorpommern',
      Niedersachsen: 'Niedersachsen',
      'Nordrhein-Westfalen': 'Nordrhein-Westfalen',
      'Rheinland-Pfalz': 'Rheinland-Pfalz',
      Saarland: 'Saarland',
      Sachsen: 'Sachsen',
      'Sachsen-Anhalt': 'Sachsen-Anhalt',
      'Schleswig-Holstein': 'Schleswig-Holstein',
      Thüringen: 'Thüringen',
    },
  },
  en: {
    app_title: 'German License Plates',
    app_title_short: 'Plates',
    all_states: 'all states',
    all_states_dative: 'all states',
    seen: 'Seen',
    seen_question: 'Seen?',
    already_seen: 'Already seen',
    search_placeholder: 'Search for license plate or city...',
    no_plates_found: 'No license plates found for',
    no_plates_available: 'No license plates available',
    search_hint: 'Try entering fewer letters or check the spelling.',
    reset_filters: 'Reset filters',
    clear_all_filters: 'Clear all filters',
    show_all: 'Show all',
    back: 'Back',
    toggle_map: 'Show/hide map',
    alphabetical_view: 'Alphabetical',
    grouped_view: 'By State',
    loading: 'Loading',
    loading_plates: 'Loading license plate data...',
    mark_as_seen: 'Mark as seen',
    seen_on: 'Seen on',
    export_seen: 'Export seen',
    import_seen: 'Import seen',
    export_success: 'Export successful',
    import_success: 'Import successful',
    import_error: 'Import error',
    imported_count: 'Imported',
    skipped_count: 'Skipped',
    jump_to_section: 'Jump to section',
    settings: 'Settings',
    language: 'Language',
    german: 'Deutsch',
    english: 'English',
    theme: 'Theme',
    theme_system: 'System',
    theme_light: 'Light',
    theme_dark: 'Dark',
    contact_label: 'Contact',
    contact_aria: 'Email Daryl',
    error_occurred: 'An error occurred',
    stateNames: {
      'Baden-Württemberg': 'Baden-Württemberg',
      Bayern: 'Bavaria',
      Berlin: 'Berlin',
      Brandenburg: 'Brandenburg',
      Bremen: 'Bremen',
      Hamburg: 'Hamburg',
      Hessen: 'Hesse',
      'Mecklenburg-Vorpommern': 'Mecklenburg-Vorpommern',
      Niedersachsen: 'Lower Saxony',
      'Nordrhein-Westfalen': 'North Rhine-Westphalia',
      'Rheinland-Pfalz': 'Rhineland-Palatinate',
      Saarland: 'Saarland',
      Sachsen: 'Saxony',
      'Sachsen-Anhalt': 'Saxony-Anhalt',
      'Schleswig-Holstein': 'Schleswig-Holstein',
      Thüringen: 'Thuringia',
    },
  },
};