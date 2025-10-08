import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LicensePlateService } from '../../services/license-plate';
import { RegionBadge } from '../region-badge/region-badge';

@Component({
  selector: 'app-license-plate-display',
  imports: [CommonModule, RegionBadge],
  templateUrl: './license-plate-display.html',
  styleUrl: './license-plate-display.scss'
})
export class LicensePlateDisplay {
  @Input() enteredText: string = '';

  private licensePlateService = inject(LicensePlateService);
  private _randomGreeting?: string;

  months = Array.from({length: 12}, (_, i) => i + 1);

  get displayText(): string {
    if (!this.enteredText) {
      return 'XXX';
    }

    // Get the top suggestion based on entered text
    const suggestions = this.licensePlateService.getSuggestions(this.enteredText, 1);

    if (suggestions.length > 0) {
      const topResult = suggestions[0];
      const topCode = topResult.code;

      // Show the full top result code
      return topCode;
    }

    // Fallback: Pad with X's to show placeholder for remaining characters
    const maxLength = 3;
    const remaining = maxLength - this.enteredText.length;
    const padding = 'X'.repeat(Math.max(0, remaining));

    return this.enteredText + padding;
  }

  get placeholderNumbers(): string {
    if (!this.enteredText) {
      return '123';
    }

    // Get the top suggestion and use its area code if available
    const suggestions = this.licensePlateService.getSuggestions(this.enteredText, 1);
    if (suggestions.length > 0 && suggestions[0].area_code) {
      return suggestions[0].area_code;
    }

    return '123';
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }

  get federalState(): string {
    if (!this.enteredText) {
      return 'Deutschland';
    }

    // Get the top suggestion and use its federal state
    const suggestions = this.licensePlateService.getSuggestions(this.enteredText, 1);
    if (suggestions.length > 0) {
      return suggestions[0].federal_state;
    }

    return 'Deutschland';
  }

  get regionName(): string {
    if (!this.enteredText) {
      return '';
    }

    const suggestions = this.licensePlateService.getSuggestions(this.enteredText, 1);
    if (suggestions.length > 0) {
      return suggestions[0].city_district;
    }

    return '';
  }

  get hasTopResult(): boolean {
    if (!this.enteredText) {
      return false;
    }

    const suggestions = this.licensePlateService.getSuggestions(this.enteredText, 1);
    return suggestions.length > 0;
  }

  get randomGreeting(): string {
    if (!this._randomGreeting) {
      const greetings = ['Moin.', 'Auf geht\'s.', 'Hallo.', 'Na dann.', 'Los geht\'s!', 'Servus!'];
      this._randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    }
    return this._randomGreeting;
  }
}
