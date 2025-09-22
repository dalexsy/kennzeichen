import { Component, Input, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { KennzeichenService } from '../../services/kennzeichen';
import { RegionBadge } from '../region-badge/region-badge';

@Component({
  selector: 'app-license-plate-display',
  imports: [NgIf, RegionBadge],
  templateUrl: './license-plate-display.html',
  styleUrl: './license-plate-display.scss'
})
export class LicensePlateDisplay {
  @Input() enteredText: string = '';

  private kennzeichenService = inject(KennzeichenService);

  get displayText(): string {
    if (!this.enteredText) {
      return 'XXX';
    }

    // Get the top suggestion based on entered text
    const suggestions = this.kennzeichenService.getSuggestions(this.enteredText, 1);

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
    return '123';
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }

  get federalState(): string {
    if (!this.enteredText) {
      return '';
    }

    // Get the top suggestion and use its federal state
    const suggestions = this.kennzeichenService.getSuggestions(this.enteredText, 1);
    if (suggestions.length > 0) {
      return suggestions[0].federal_state;
    }

    return '';
  }

  get regionName(): string {
    if (!this.enteredText) {
      return '';
    }

    const suggestions = this.kennzeichenService.getSuggestions(this.enteredText, 1);
    if (suggestions.length > 0) {
      return suggestions[0].city_district;
    }

    return '';
  }

  get hasTopResult(): boolean {
    if (!this.enteredText) {
      return false;
    }

    const suggestions = this.kennzeichenService.getSuggestions(this.enteredText, 1);
    return suggestions.length > 0;
  }
}
