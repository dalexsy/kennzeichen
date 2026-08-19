import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Translations } from '../../../services/localization/localization-translations';

@Component({
  selector: 'app-map-toggles',
  imports: [CommonModule],
  templateUrl: './map-toggles.html',
  styleUrl: './map-toggles.scss',
})
export class MapToggles {
  @Input() isMapVisible = false;
  @Input() shouldShowMapButton = false;
  @Input() shouldShowSeenButton = false;
  @Input() isSettingsOpen = false;
  @Input() seenFilterActive = false;
  @Input() seenCount = 0;
  @Input() translations$!: Observable<Translations>;
  @Output() mapToggle = new EventEmitter<void>();
  @Output() seenToggle = new EventEmitter<void>();
}
