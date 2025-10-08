import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { LicensePlate } from '../../models/license-plate.interface';
import { LicensePlateGroup, LicensePlateService } from '../../services/license-plate';
import { LocalStorageService } from '../../services/local-storage';
import { LicensePlateItem } from '../license-plate-item/license-plate-item';
import { ViewToggle } from '../view-toggle/view-toggle';

@Component({
  selector: 'app-license-plate-list',
  imports: [CommonModule, LicensePlateItem, ViewToggle],
  templateUrl: './license-plate-list.html',
  styleUrl: './license-plate-list.scss'
})
export class LicensePlateList {
  @Input() groupedLicensePlates$!: Observable<LicensePlateGroup[]>;
  @Input() seenCodes$!: Observable<Set<string>>;
  @Input() searchTerm: string = '';
  @Input() selectedCode: string = '';
  @Input() isLoading: boolean = false;
  @Output() itemClicked = new EventEmitter<LicensePlate>();
  @Output() viewChange = new EventEmitter<'alphabetical' | 'grouped'>();

  private licensePlateService = inject(LicensePlateService);
  private localStorageService = inject(LocalStorageService);
  viewMode$ = this.licensePlateService.viewMode$;

  onItemClicked(licensePlate: LicensePlate): void {
    this.itemClicked.emit(licensePlate);
  }

  onViewChange(view: 'alphabetical' | 'grouped'): void {
    this.viewChange.emit(view);
  }

  trackByCode(index: number, licensePlate: LicensePlate): string {
    return licensePlate.code;
  }

  trackByState(index: number, group: LicensePlateGroup): string {
    return group.state;
  }

  getTotalCount(groups: LicensePlateGroup[]): number {
    return groups.reduce((total, group) => total + group.licensePlates.length, 0);
  }

  getSeenDate(code: string): string | null {
    return this.localStorageService.getSeenDate(code);
  }
}
