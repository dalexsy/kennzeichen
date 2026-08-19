import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Translations } from '../../../services/localization/localization-translations';

@Component({
  selector: 'app-list-empty',
  imports: [CommonModule],
  templateUrl: './list-empty.html',
  styleUrl: './list-empty.scss',
})
export class ListEmpty {
  @Input() searchTerm = '';
  @Input() translations$!: Observable<Translations>;
  @Output() clearFilters = new EventEmitter<void>();
}
