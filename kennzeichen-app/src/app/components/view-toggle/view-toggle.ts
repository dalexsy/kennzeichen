import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-toggle',
  imports: [CommonModule],
  templateUrl: './view-toggle.html',
  styleUrl: './view-toggle.scss'
})
export class ViewToggle {
  @Input() currentView: 'alphabetical' | 'grouped' = 'alphabetical';
  @Output() viewChange = new EventEmitter<'alphabetical' | 'grouped'>();

  toggleView(): void {
    const newView = this.currentView === 'alphabetical' ? 'grouped' : 'alphabetical';
    this.viewChange.emit(newView);
  }
}