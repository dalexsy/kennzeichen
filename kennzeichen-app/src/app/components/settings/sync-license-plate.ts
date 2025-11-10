import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sync-license-plate',
  imports: [CommonModule],
  templateUrl: './sync-license-plate.html',
  styleUrl: './sync-license-plate.scss',
})
export class SyncLicensePlateComponent implements OnChanges {
  @Input() shortCode: string = '';

  letters: string[] = [];
  numbers: string[] = [];
  currentYear = new Date().getFullYear();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['shortCode']) {
      this.updateDisplay();
    }
  }

  private updateDisplay(): void {
    if (this.shortCode && this.shortCode.length === 6) {
      this.letters = this.shortCode.slice(0, 3).split('');
      this.numbers = this.shortCode.slice(3, 6).split('');
    } else {
      this.letters = [];
      this.numbers = [];
    }
  }
}
