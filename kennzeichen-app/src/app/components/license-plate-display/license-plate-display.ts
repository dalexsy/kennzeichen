import { Component, Input, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LicensePlateService } from '../../services/license-plate';
import { RegionBadge } from '../region-badge/region-badge';

@Component({
  selector: 'app-license-plate-display',
  imports: [CommonModule, RegionBadge],
  templateUrl: './license-plate-display.html',
  styleUrl: './license-plate-display.scss'
})
export class LicensePlateDisplay implements OnDestroy {
  @Input() set enteredText(value: string) {
    this._enteredText = value;
    this.animateText();
  }
  get enteredText(): string {
    return this._enteredText;
  }

  private _enteredText: string = '';
  private licensePlateService = inject(LicensePlateService);
  private _randomGreeting?: string;

  animatedChars: string[] = [];
  animatedNumbers: string[] = [];
  private animationTimeouts: any[] = [];

  months = Array.from({length: 12}, (_, i) => i + 1);

  private animateText(): void {
    // Clear any existing animations
    this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
    this.animationTimeouts = [];

    const targetText = this.displayText;
    const targetNumbers = this.placeholderNumbers;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';

    // Initialize with random characters
    this.animatedChars = targetText.split('').map(() =>
      chars[Math.floor(Math.random() * chars.length)]
    );

    this.animatedNumbers = targetNumbers.split('').map(() =>
      digits[Math.floor(Math.random() * digits.length)]
    );

    // Animate each character to its target
    targetText.split('').forEach((targetChar, index) => {
      const delay = index * 50; // Stagger each character
      const iterations = 3 + Math.floor(Math.random() * 3); // Random flips before settling

      for (let i = 0; i <= iterations; i++) {
        const timeout = setTimeout(() => {
          if (i < iterations) {
            // Show random character
            this.animatedChars[index] = chars[Math.floor(Math.random() * chars.length)];
          } else {
            // Show final character
            this.animatedChars[index] = targetChar;
          }
        }, delay + (i * 60));

        this.animationTimeouts.push(timeout);
      }
    });

    // Animate numbers starting after letters
    const letterDelay = targetText.length * 50;
    targetNumbers.split('').forEach((targetDigit, index) => {
      const delay = letterDelay + (index * 50); // Stagger each digit
      const iterations = 3 + Math.floor(Math.random() * 3); // Random flips before settling

      for (let i = 0; i <= iterations; i++) {
        const timeout = setTimeout(() => {
          if (i < iterations) {
            // Show random digit
            this.animatedNumbers[index] = digits[Math.floor(Math.random() * digits.length)];
          } else {
            // Show final digit
            this.animatedNumbers[index] = targetDigit;
          }
        }, delay + (i * 60));

        this.animationTimeouts.push(timeout);
      }
    });
  }

  ngOnDestroy(): void {
    this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  get displayText(): string {
    if (!this.enteredText) {
      return 'ABC';
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

  get hasActualNumbers(): boolean {
    if (!this.enteredText) {
      return false;
    }

    const suggestions = this.licensePlateService.getSuggestions(this.enteredText, 1);
    return suggestions.length > 0 && !!suggestions[0].area_code;
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
