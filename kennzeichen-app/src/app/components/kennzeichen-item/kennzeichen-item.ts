import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Kennzeichen } from '../../models/kennzeichen.interface';

@Component({
  selector: 'app-kennzeichen-item',
  imports: [CommonModule],
  templateUrl: './kennzeichen-item.html',
  styleUrl: './kennzeichen-item.scss'
})
export class KennzeichenItem {
  @Input() kennzeichen!: Kennzeichen;
  @Input() isSeen: boolean = false;
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
}
