import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Kennzeichen } from '../../models/kennzeichen.interface';
import { KennzeichenGroup } from '../../services/kennzeichen';
import { KennzeichenItem } from '../kennzeichen-item/kennzeichen-item';

@Component({
  selector: 'app-kennzeichen-list',
  imports: [CommonModule, KennzeichenItem],
  templateUrl: './kennzeichen-list.html',
  styleUrl: './kennzeichen-list.scss'
})
export class KennzeichenList {
  @Input() groupedKennzeichen$!: Observable<KennzeichenGroup[]>;
  @Input() seenCodes$!: Observable<Set<string>>;
  @Input() searchTerm: string = '';
  @Input() isLoading: boolean = false;
  @Output() itemClicked = new EventEmitter<Kennzeichen>();

  onItemClicked(kennzeichen: Kennzeichen): void {
    this.itemClicked.emit(kennzeichen);
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
