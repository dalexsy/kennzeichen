import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalizationService, Language } from '../../services/localization/localization.service';
import { ThemeService } from '../../services/theme/theme.service';
import { DrylSyncService } from '../../services/dryl-sync/dryl-sync.service';
import { Button } from '../button/button';
import { SyncLicensePlateComponent } from '../sync-license-plate/sync-license-plate';
import { SettingsMenu } from './settings-menu/settings-menu';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule, Button, SyncLicensePlateComponent, SettingsMenu],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsComponent {
  @Output() menuOpenChange = new EventEmitter<boolean>();

  localizationService = inject(LocalizationService);
  themeService = inject(ThemeService);
  drylSyncService = inject(DrylSyncService);

  translations$ = this.localizationService.translations$;

  showSyncModal = false;
  userIdInput = '';
  isMenuOpen = false;
  shortCode$ = this.drylSyncService.getShortCode();

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
    return this.drylSyncService.getUserId();
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
    void this.drylSyncService.manualSync().then(() => {
      if (this.drylSyncService.isSyncEnabled()) {
        alert('Synced with your dryl account. Sign in on other devices to share progress.');
        this.showSyncModal = false;
      } else {
        alert('Sign in at admin.dryl.io, then open Plates again to sync.');
      }
    });
  }
}
