import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-list-nav',
  templateUrl: './list-nav.html',
  styleUrl: './list-nav.scss',
})
export class ListNav {
  @Input() showNavButtons = false;
  @Input() showBackToTop = false;
  @Input() isMapButtonVisible = false;
  @Input() canGoNext = false;
  @Input() canGoPrevious = false;
  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();
  @Output() backToTop = new EventEmitter<void>();
}
