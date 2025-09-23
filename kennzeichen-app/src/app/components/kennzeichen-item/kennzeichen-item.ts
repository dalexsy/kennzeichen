import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LicensePlate } from '../../models/kennzeichen.interface';
import { RegionBadge } from '../region-badge/region-badge';

@Component({
  selector: 'app-license-plate-item',
  imports: [CommonModule, RegionBadge],
  templateUrl: './kennzeichen-item.html',
  styleUrl: './kennzeichen-item.scss'
})
export class LicensePlateItem {
  @Input() licensePlate!: LicensePlate;
  @Input() isSeen: boolean = false;
  @Input() isSelected: boolean = false;
  @Input() searchTerm: string = '';
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
}
