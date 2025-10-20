import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'de' | 'en';

export interface Translations {
  // General
  all_states: string;
  all_states_dative: string;
  seen: string;
  seen_question: string;
  already_seen: string;

  // Search and filters
  search_placeholder: string;
  no_plates_found: string;
  no_plates_available: string;
  search_hint: string;
  reset_filters: string;
  clear_all_filters: string;
  show_all: string;
  back: string;

  // Map
  toggle_map: string;

  // View modes
  alphabetical_view: string;
  grouped_view: string;

  // License plate list
  loading: string;
  loading_plates: string;

  // Seen functionality
  mark_as_seen: string;
  seen_on: string;
  export_seen: string;
  import_seen: string;
  export_success: string;
  import_success: string;
  import_error: string;
  imported_count: string;
  skipped_count: string;

  // Table of contents
  jump_to_section: string;

  // Settings
  settings: string;
  language: string;
  german: string;
  english: string;
  theme: string;
  theme_system: string;
  theme_light: string;
  theme_dark: string;

  // Errors
  error_occurred: string;

  // State names
  stateNames: Record<string, string>;
}

const translations: Record<Language, Translations> = {
  de: {
    // General
    all_states: 'alle Staaten',
    all_states_dative: 'allen Staaten',
    seen: 'Gesehen',
    seen_question: 'Gesehen?',
    already_seen: 'Schon gesehen',

    // Search and filters
    search_placeholder: 'Suche nach Kennzeichen oder Stadt...',
    no_plates_found: 'Keine Kennzeichen gefunden für',
    no_plates_available: 'Keine Kennzeichen verfügbar',
    search_hint: 'Versuche weniger Buchstaben einzugeben oder überprüfe die Schreibweise.',
    reset_filters: 'Filter zurücksetzen',
    clear_all_filters: 'Alle Filter löschen',
    show_all: 'Alles zeigen',
    back: 'Zurück',

    // Map
    toggle_map: 'Karte anzeigen/verbergen',

    // View modes
    alphabetical_view: 'Alphabetisch',
    grouped_view: 'Nach Bundesland',

    // License plate list
    loading: 'Wird geladen',
    loading_plates: 'Kennzeichendaten werden geladen...',

    // Seen functionality
    mark_as_seen: 'Als gesehen markieren',
    seen_on: 'Gesehen am',
    export_seen: 'Gesehene exportieren',
    import_seen: 'Gesehene importieren',
    export_success: 'Export erfolgreich',
    import_success: 'Import erfolgreich',
    import_error: 'Fehler beim Import',
    imported_count: 'Importiert',
    skipped_count: 'Übersprungen',

    // Table of contents
    jump_to_section: 'Zu Abschnitt springen',

    // Settings
    settings: 'Einstellungen',
    language: 'Sprache',
    german: 'Deutsch',
    english: 'English',
    theme: 'Design',
    theme_system: 'System',
    theme_light: 'Hell',
    theme_dark: 'Dunkel',

    // Errors
    error_occurred: 'Ein Fehler ist aufgetreten',

    // State names (German stays the same)
    stateNames: {
      'Baden-Württemberg': 'Baden-Württemberg',
      'Bayern': 'Bayern',
      'Berlin': 'Berlin',
      'Brandenburg': 'Brandenburg',
      'Bremen': 'Bremen',
      'Hamburg': 'Hamburg',
      'Hessen': 'Hessen',
      'Mecklenburg-Vorpommern': 'Mecklenburg-Vorpommern',
      'Niedersachsen': 'Niedersachsen',
      'Nordrhein-Westfalen': 'Nordrhein-Westfalen',
      'Rheinland-Pfalz': 'Rheinland-Pfalz',
      'Saarland': 'Saarland',
      'Sachsen': 'Sachsen',
      'Sachsen-Anhalt': 'Sachsen-Anhalt',
      'Schleswig-Holstein': 'Schleswig-Holstein',
      'Thüringen': 'Thüringen'
    }
  },
  en: {
    // General
    all_states: 'all states',
    all_states_dative: 'all states',
    seen: 'Seen',
    seen_question: 'Seen?',
    already_seen: 'Already seen',

    // Search and filters
    search_placeholder: 'Search for license plate or city...',
    no_plates_found: 'No license plates found for',
    no_plates_available: 'No license plates available',
    search_hint: 'Try entering fewer letters or check the spelling.',
    reset_filters: 'Reset filters',
    clear_all_filters: 'Clear all filters',
    show_all: 'Show all',
    back: 'Back',

    // Map
    toggle_map: 'Show/hide map',

    // View modes
    alphabetical_view: 'Alphabetical',
    grouped_view: 'By State',

    // License plate list
    loading: 'Loading',
    loading_plates: 'Loading license plate data...',

    // Seen functionality
    mark_as_seen: 'Mark as seen',
    seen_on: 'Seen on',
    export_seen: 'Export seen',
    import_seen: 'Import seen',
    export_success: 'Export successful',
    import_success: 'Import successful',
    import_error: 'Import error',
    imported_count: 'Imported',
    skipped_count: 'Skipped',

    // Table of contents
    jump_to_section: 'Jump to section',

    // Settings
    settings: 'Settings',
    language: 'Language',
    german: 'Deutsch',
    english: 'English',
    theme: 'Theme',
    theme_system: 'System',
    theme_light: 'Light',
    theme_dark: 'Dark',

    // Errors
    error_occurred: 'An error occurred',

    // State names (English translations)
    stateNames: {
      'Baden-Württemberg': 'Baden-Württemberg',
      'Bayern': 'Bavaria',
      'Berlin': 'Berlin',
      'Brandenburg': 'Brandenburg',
      'Bremen': 'Bremen',
      'Hamburg': 'Hamburg',
      'Hessen': 'Hesse',
      'Mecklenburg-Vorpommern': 'Mecklenburg-Vorpommern',
      'Niedersachsen': 'Lower Saxony',
      'Nordrhein-Westfalen': 'North Rhine-Westphalia',
      'Rheinland-Pfalz': 'Rhineland-Palatinate',
      'Saarland': 'Saarland',
      'Sachsen': 'Saxony',
      'Sachsen-Anhalt': 'Saxony-Anhalt',
      'Schleswig-Holstein': 'Schleswig-Holstein',
      'Thüringen': 'Thuringia'
    }
  }
};

@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  private readonly LANGUAGE_KEY = 'preferred-language';
  private languageSubject: BehaviorSubject<Language>;

  public language$: Observable<Language>;
  public translations$: Observable<Translations>;

  constructor() {
    const savedLanguage = this.getSavedLanguage();
    this.languageSubject = new BehaviorSubject<Language>(savedLanguage);
    this.language$ = this.languageSubject.asObservable();

    // Create translations observable that updates when language changes
    this.translations$ = new BehaviorSubject<Translations>(translations[savedLanguage]);
    this.language$.subscribe(lang => {
      (this.translations$ as BehaviorSubject<Translations>).next(translations[lang]);
    });
  }

  private getSavedLanguage(): Language {
    try {
      const saved = localStorage.getItem(this.LANGUAGE_KEY);
      if (saved === 'de' || saved === 'en') {
        return saved;
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }

    // Default to German
    return 'de';
  }

  getCurrentLanguage(): Language {
    return this.languageSubject.value;
  }

  setLanguage(language: Language): void {
    try {
      localStorage.setItem(this.LANGUAGE_KEY, language);
      this.languageSubject.next(language);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }

  getTranslations(): Translations {
    return translations[this.languageSubject.value];
  }

  translate(key: keyof Translations): string {
    const value = translations[this.languageSubject.value][key];
    // Return empty string for complex objects like stateNames
    return typeof value === 'string' ? value : '';
  }

  translateStateName(germanName: string): string {
    const currentTranslations = translations[this.languageSubject.value];
    return currentTranslations.stateNames[germanName] || germanName;
  }
}
