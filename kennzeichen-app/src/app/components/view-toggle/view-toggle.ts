import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocalizationService } from '../../services/localization.service';

@Component({
  selector: 'app-view-toggle',
  imports: [CommonModule],
  templateUrl: './view-toggle.html',
  styleUrl: './view-toggle.scss'
})
export class ViewToggle {
  @Input() currentView: 'alphabetical' | 'grouped' = 'alphabetical';
  @Output() viewChange = new EventEmitter<'alphabetical' | 'grouped'>();

  localizationService = inject(LocalizationService);
  translations$ = this.localizationService.translations$;

  toggleView(): void {
    const newView = this.currentView === 'alphabetical' ? 'grouped' : 'alphabetical';
    this.viewChange.emit(newView);
  }
}