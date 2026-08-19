import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateInfo } from '../../../services/map-state/map-state.service';
import { LocalizationService } from '../../../services/localization/localization.service';

@Component({
  selector: 'app-map-state-tiles',
  imports: [CommonModule],
  templateUrl: './map-state-tiles.html',
  styleUrl: './map-state-tiles.scss',
})
export class MapStateTiles {
  @Input() states: StateInfo[] = [];
  @Input() highlightedState = '';
  @Input() availableStates: Set<string> = new Set();
  @Input() activeFilterText = '';
  @Output() stateTileClick = new EventEmitter<StateInfo>();

  constructor(public localizationService: LocalizationService) {}

  isStateActive(state: StateInfo): boolean {
    return this.highlightedState === state.name;
  }

  isStateDimmed(state: StateInfo): boolean {
    const isHighlightedButNotThis =
      this.highlightedState !== '' && this.highlightedState !== state.name;
    const isNotAvailable =
      this.availableStates.size > 0 && !this.availableStates.has(state.name);
    return isHighlightedButNotThis || isNotAvailable;
  }
}
