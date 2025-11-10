import { Component, inject, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalStorageService } from '../../services/local-storage';
import { LocalizationService, Language } from '../../services/localization.service';
import { ThemeService, Theme } from '../../services/theme.service';
import { FirebaseSyncService } from '../../services/firebase-sync.service';
import { Observable } from 'rxjs';
import { Button } from '../button/button';
import { SyncLicensePlateComponent } from './sync-license-plate';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule, Button, SyncLicensePlateComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent {
  @Output() menuOpenChange = new EventEmitter<boolean>();

  localStorageService = inject(LocalStorageService);
  localizationService = inject(LocalizationService);
  themeService = inject(ThemeService);
  firebaseSyncService = inject(FirebaseSyncService);

  translations$ = this.localizationService.translations$;
  language$ = this.localizationService.language$;
  theme$ = this.themeService.theme$;

  showSyncModal = false;
  userIdInput = '';
  isMenuOpen = false;
  shortCode$ = this.firebaseSyncService.getShortCode();

  constructor() {
    // Watch for short code changes and update the input field
    this.updateShortCodeInput();
    // Check again after a short delay in case auth is still initializing
    setTimeout(() => this.updateShortCodeInput(), 1000);
  }
  private updateShortCodeInput(): void {
    // Subscribe to short code changes
    this.shortCode$.subscribe((shortCode) => {
      if (shortCode && !this.userIdInput) {
        this.userIdInput = shortCode;
      }
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.menuOpenChange.emit(this.isMenuOpen);
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    this.menuOpenChange.emit(false);
  }

  showSyncModalAction(): void {
    this.updateShortCodeInput(); // Refresh the short code before showing modal
    this.showSyncModal = true;
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

  getUserId(): string | null {
    return this.firebaseSyncService.getUserId();
  }

  copyUserId(): void {
    // Get the current short code value
    const subscription = this.shortCode$.subscribe((shortCode) => {
      if (shortCode) {
        navigator.clipboard
          .writeText(shortCode)
          .then(() => {
            console.log('Sync code copied to clipboard');
          })
          .catch((err) => {
            console.error('Failed to copy sync code:', err);
            alert(`Sync code: ${shortCode}`);
          });
      }
      subscription.unsubscribe();
    });
  }

  onSubmitUserId(): void {
    if (!this.userIdInput.trim()) {
      alert('Please enter a sync code');
      return;
    }

    this.firebaseSyncService
      .importUserId(this.userIdInput.trim())
      .then((success) => {
        if (success) {
          alert('Sync code stored for reference');
          this.showSyncModal = false;
          this.userIdInput = '';
        } else {
          alert('Failed to store sync code');
        }
      })
      .catch((error) => {
        console.error('Import error:', error);
        alert('Error storing sync code');
      });
  }
}
