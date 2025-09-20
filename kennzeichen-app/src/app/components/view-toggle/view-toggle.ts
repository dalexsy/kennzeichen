import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-toggle',
  imports: [CommonModule],
  templateUrl: './view-toggle.html',
  styleUrl: './view-toggle.scss'
})
export class ViewToggle {
  @Output() viewChange = new EventEmitter<'alphabetical' | 'grouped'>();

  currentView: 'alphabetical' | 'grouped' = 'alphabetical';

  toggleView(): void {
    this.currentView = this.currentView === 'alphabetical' ? 'grouped' : 'alphabetical';
    this.viewChange.emit(this.currentView);
  }
}