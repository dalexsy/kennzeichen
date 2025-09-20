import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-license-plate-display',
  imports: [],
  templateUrl: './license-plate-display.html',
  styleUrl: './license-plate-display.scss'
})
export class LicensePlateDisplay {
  @Input() enteredText: string = '';

  get displayText(): string {
    if (!this.enteredText) {
      return 'XXX';
    }

    // Pad with X's to show placeholder for remaining characters
    const maxLength = 3;
    const remaining = maxLength - this.enteredText.length;
    const padding = 'X'.repeat(Math.max(0, remaining));

    return this.enteredText + padding;
  }

  get placeholderNumbers(): string {
    return 'XX 123';
  }
}
