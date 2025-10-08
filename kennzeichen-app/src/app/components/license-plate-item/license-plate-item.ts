import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LicensePlate } from '../../models/license-plate.interface';
import { RegionBadge } from '../region-badge/region-badge';

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

    // Reset time parts for comparison
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    seenDateObj.setHours(0, 0, 0, 0);

    if (seenDateObj.getTime() === today.getTime()) {
      return 'heute gesehen';
    } else if (seenDateObj.getTime() === yesterday.getTime()) {
      return 'gestern gesehen';
    } else {
      const day = seenDateObj.getDate().toString().padStart(2, '0');
      const month = (seenDateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = seenDateObj.getFullYear();
      return `gesehen am ${day}.${month}.${year}`;
    }
  }
}
