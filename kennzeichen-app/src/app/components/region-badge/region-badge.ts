import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-region-badge',
  imports: [CommonModule],
  templateUrl: './region-badge.html',
  styleUrl: './region-badge.scss'
})
export class RegionBadge {
  @Input() federalState: string = '';
  @Input() size: 'small' | 'medium' | 'large' = 'small';

  get coatOfArmsPath(): string | null {
    if (!this.federalState) {
      return null;
    }
    return `wappen/${this.federalState}.svg`;
  }
}