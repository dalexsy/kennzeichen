import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Theme = 'system' | 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'preferred-theme';
  private themeSubject: BehaviorSubject<Theme>;
  public theme$: Observable<Theme>;

  constructor() {
    const savedTheme = this.getSavedTheme();
    this.themeSubject = new BehaviorSubject<Theme>(savedTheme);
    this.theme$ = this.themeSubject.asObservable();
    this.applyTheme(savedTheme);
  }

  private getSavedTheme(): Theme {
    try {
      const saved = localStorage.getItem(this.THEME_KEY);
      if (saved === 'system' || saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
    return 'system';
  }

  getCurrentTheme(): Theme {
    return this.themeSubject.value;
  }

  setTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.THEME_KEY, theme);
      this.themeSubject.next(theme);
      this.applyTheme(theme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }

  cycleTheme(): void {
    const current = this.getCurrentTheme();
    const themes: Theme[] = ['system', 'light', 'dark'];
    const currentIndex = themes.indexOf(current);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    this.setTheme(nextTheme);
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;

    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }
}
