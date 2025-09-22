import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Kennzeichen } from '../../models/kennzeichen.interface';
import { KennzeichenGroup, KennzeichenService } from '../../services/kennzeichen';
import { KennzeichenItem } from '../kennzeichen-item/kennzeichen-item';
import { ViewToggle } from '../view-toggle/view-toggle';

@Component({
  selector: 'app-kennzeichen-list',
  imports: [CommonModule, KennzeichenItem, ViewToggle],
  templateUrl: './kennzeichen-list.html',
  styleUrl: './kennzeichen-list.scss'
})
export class KennzeichenList {
  @Input() groupedKennzeichen$!: Observable<KennzeichenGroup[]>;
  @Input() seenCodes$!: Observable<Set<string>>;
  @Input() searchTerm: string = '';
  @Input() selectedCode: string = '';
  @Input() isLoading: boolean = false;
  @Output() itemClicked = new EventEmitter<Kennzeichen>();
  @Output() viewChange = new EventEmitter<'alphabetical' | 'grouped'>();

  private kennzeichenService = inject(KennzeichenService);
  viewMode$ = this.kennzeichenService.viewMode$;

  onItemClicked(kennzeichen: Kennzeichen): void {
    this.itemClicked.emit(kennzeichen);
  }

  onViewChange(view: 'alphabetical' | 'grouped'): void {
    this.viewChange.emit(view);
  }

  trackByCode(index: number, kennzeichen: Kennzeichen): string {
    return kennzeichen.code;
  }

  trackByState(index: number, group: KennzeichenGroup): string {
    return group.state;
  }

  getTotalCount(groups: KennzeichenGroup[]): number {
    return groups.reduce((total, group) => total + group.kennzeichen.length, 0);
  }
}
