import { Component, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocalStorageService } from '../../services/local-storage';
import { LocalizationService, Language } from '../../services/localization.service';
import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class SettingsComponent {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  localStorageService = inject(LocalStorageService);
  localizationService = inject(LocalizationService);
  themeService = inject(ThemeService);

  translations$ = this.localizationService.translations$;
  language$ = this.localizationService.language$;
  theme$ = this.themeService.theme$;

  importMessage: string = '';
  isMenuOpen = false;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  onExport(): void {
    try {
      this.localStorageService.exportSeenData();
      this.closeMenu();
    } catch (error) {
      console.error('Export failed:', error);
      alert(this.localizationService.translate('error_occurred'));
    }
  }

  onImport(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = this.localStorageService.importSeenData(content);

      if (result.success) {
        const t = this.localizationService.getTranslations();
        this.importMessage = `${t.import_success}: ${t.imported_count} ${result.imported}, ${t.skipped_count} ${result.skipped}`;
        setTimeout(() => {
          this.importMessage = '';
        }, 5000);
      } else {
        this.importMessage = `${this.localizationService.translate('import_error')}: ${result.error}`;
        setTimeout(() => {
          this.importMessage = '';
        }, 5000);
      }

      this.closeMenu();
    };

    reader.onerror = () => {
      this.importMessage = this.localizationService.translate('error_occurred');
      setTimeout(() => {
        this.importMessage = '';
      }, 5000);
    };

    reader.readAsText(file);
    // Reset input so the same file can be selected again
    input.value = '';
  }

  toggleLanguage(): void {
    const currentLang = this.localizationService.getCurrentLanguage();
    const newLang: Language = currentLang === 'de' ? 'en' : 'de';
    this.localizationService.setLanguage(newLang);
  }

  getCurrentLanguageLabel(): string {
    const lang = this.localizationService.getCurrentLanguage();
    const t = this.localizationService.getTranslations();
    return lang === 'de' ? t.german : t.english;
  }

  cycleTheme(): void {
    this.themeService.cycleTheme();
  }

  getCurrentThemeLabel(): string {
    const theme = this.themeService.getCurrentTheme();
    const t = this.localizationService.getTranslations();
    switch (theme) {
      case 'system':
        return t.theme_system;
      case 'light':
        return t.theme_light;
      case 'dark':
        return t.theme_dark;
    }
  }
}
