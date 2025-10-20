import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LicensePlate } from '../../models/license-plate.interface';
import { RegionBadge } from '../region-badge/region-badge';
import { LocalizationService } from '../../services/localization.service';

@Component({
  selector: 'app-license-plate-item',
  imports: [CommonModule, RegionBadge],
  templateUrl: './license-plate-item.html',
  styleUrl: './license-plate-item.scss'
})
export class LicensePlateItem {
  @Input() licensePlate!: LicensePlate;
  @Input() isSeen: boolean = false;
  @Input() isSelected: boolean = false;
  @Input() searchTerm: string = '';
  @Input() seenDate: string | null = null;
  @Output() itemClicked = new EventEmitter<LicensePlate>();

  public localizationService = inject(LocalizationService);

  onClick(): void {
    this.itemClicked.emit(this.licensePlate);
  }

  getHighlightedCode(): string {
    if (!this.searchTerm) {
      return this.licensePlate.code;
    }

    const term = this.searchTerm.toLowerCase();
    const code = this.licensePlate.code.toLowerCase();

    if (code.startsWith(term)) {
      const highlighted = this.licensePlate.code.substring(0, this.searchTerm.length);
      const rest = this.licensePlate.code.substring(this.searchTerm.length);
      return `<span class="highlighted">${highlighted}</span>${rest}`;
    }

    return this.licensePlate.code;
  }

  getHighlightedOrigin(): string {
    const code = this.licensePlate.code.toUpperCase();
    const origin = this.licensePlate.derived_from;

    // Create a result string with highlighted letters
    let result = '';
    let codeIndex = 0;

    for (let i = 0; i < origin.length; i++) {
      const char = origin[i];
      const upperChar = char.toUpperCase();

      // Check if this character matches the current letter in the code
      if (codeIndex < code.length && upperChar === code[codeIndex]) {
        result += `<strong>${upperChar}</strong>`;
        codeIndex++;
      } else {
        result += char;
      }
    }

    return result;
  }

  getSeenDateText(): string {
    if (!this.seenDate) {
      return '';
    }

    const seenDateObj = new Date(this.seenDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    seenDateObj.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - seenDateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'heute gesehen';
    } else if (diffDays === 1) {
      return 'gestern gesehen';
    } else if (diffDays === 2) {
      return 'vorgestern gesehen';
    } else if (diffDays <= 7) {
      return 'vor ein paar Tagen gesehen';
    } else if (diffDays <= 14) {
      return 'vor einer Woche gesehen';
    } else if (diffDays <= 30) {
      return 'vor ein paar Wochen gesehen';
    } else if (diffDays <= 60) {
      return 'vor einem Monat gesehen';
    } else {
      return 'vor langer Zeit gesehen';
    }
  }
}
