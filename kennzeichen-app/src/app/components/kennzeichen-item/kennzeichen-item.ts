import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Kennzeichen } from '../../models/kennzeichen.interface';
import { RegionBadge } from '../region-badge/region-badge';

@Component({
  selector: 'app-kennzeichen-item',
  imports: [CommonModule, RegionBadge],
  templateUrl: './kennzeichen-item.html',
  styleUrl: './kennzeichen-item.scss'
})
export class KennzeichenItem {
  @Input() kennzeichen!: Kennzeichen;
  @Input() isSeen: boolean = false;
  @Input() isSelected: boolean = false;
  @Input() searchTerm: string = '';
  @Output() itemClicked = new EventEmitter<Kennzeichen>();

  onClick(): void {
    this.itemClicked.emit(this.kennzeichen);
  }

  getHighlightedCode(): string {
    if (!this.searchTerm) {
      return this.kennzeichen.code;
    }

    const term = this.searchTerm.toLowerCase();
    const code = this.kennzeichen.code.toLowerCase();

    if (code.startsWith(term)) {
      const highlighted = this.kennzeichen.code.substring(0, this.searchTerm.length);
      const rest = this.kennzeichen.code.substring(this.searchTerm.length);
      return `<span class="highlighted">${highlighted}</span>${rest}`;
    }

    return this.kennzeichen.code;
  }

  getHighlightedOrigin(): string {
    const code = this.kennzeichen.code.toUpperCase();
    const origin = this.kennzeichen.derived_from;

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
