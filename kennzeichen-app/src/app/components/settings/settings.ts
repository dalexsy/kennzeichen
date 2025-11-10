import { Component, inject, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalStorageService } from '../../services/local-storage';
import { LocalizationService, Language } from '../../services/localization.service';
import { ThemeService, Theme } from '../../services/theme.service';
import { FirebaseSyncService } from '../../services/firebase-sync.service';
import { Observable } from 'rxjs';
import { Button } from '../button/button';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule, Button],
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

  constructor() {
    // Watch for user ID changes and update the input field
    this.updateUserIdInput();
    // Check again after a short delay in case auth is still initializing
    setTimeout(() => this.updateUserIdInput(), 1000);
  }

  private updateUserIdInput(): void {
    const currentId = this.getUserId();
    if (currentId && !this.userIdInput) {
      this.userIdInput = currentId;
    }
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
    this.updateUserIdInput(); // Refresh the user ID before showing modal
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
    const userId = this.firebaseSyncService.getUserId();
    if (userId) {
      navigator.clipboard
        .writeText(userId)
        .then(() => {
          console.log('User ID copied to clipboard');
        })
        .catch((err) => {
          console.error('Failed to copy user ID:', err);
          alert(`User ID: ${userId}`);
        });
    }
  }

  onSubmitUserId(): void {
    if (!this.userIdInput.trim()) {
      alert('Please enter a User ID');
      return;
    }

    this.firebaseSyncService
      .importUserId(this.userIdInput.trim())
      .then((success) => {
        if (success) {
          alert('User ID stored for reference');
          this.showSyncModal = false;
          this.userIdInput = '';
        } else {
          alert('Failed to store User ID');
        }
      })
      .catch((error) => {
        console.error('Import error:', error);
        alert('Error storing User ID');
      });
  }
}
