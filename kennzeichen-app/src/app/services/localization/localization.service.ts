import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Language,
  Translations,
  translations,
} from './localization-translations';

export type { Language, Translations };

@Injectable({
  providedIn: 'root',
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

    this.translations$ = new BehaviorSubject<Translations>(translations[savedLanguage]);
    this.language$.subscribe((lang) => {
      (this.translations$ as BehaviorSubject<Translations>).next(translations[lang]);
      this.applyDocumentLanguage(lang);
    });
    this.applyDocumentLanguage(savedLanguage);
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

    return 'de';
  }

  getCurrentLanguage(): Language {
    return this.languageSubject.value;
  }

  setLanguage(language: Language): void {
    try {
      localStorage.setItem(this.LANGUAGE_KEY, language);
      this.languageSubject.next(language);
      this.applyDocumentLanguage(language);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }

  private applyDocumentLanguage(language: Language): void {
    const t = translations[language];
    document.documentElement.lang = language;
    document.title = t.app_title;
    const short = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (short) {
      short.setAttribute('content', t.app_title_short);
    }
  }

  getTranslations(): Translations {
    return translations[this.languageSubject.value];
  }

  translate(key: keyof Translations): string {
    const value = translations[this.languageSubject.value][key];
    return typeof value === 'string' ? value : '';
  }

  translateStateName(germanName: string): string {
    const currentTranslations = translations[this.languageSubject.value];
    return currentTranslations.stateNames[germanName] || germanName;
  }
}