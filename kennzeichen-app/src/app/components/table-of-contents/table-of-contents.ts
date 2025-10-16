import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LicensePlateGroup } from '../../services/license-plate';
import { MapStateService } from '../../services/map-state.service';

@Component({
  selector: 'app-table-of-contents',
  imports: [CommonModule],
  templateUrl: './table-of-contents.html',
  styleUrl: './table-of-contents.scss'
})
export class TableOfContentsComponent {
  @Input() groups: LicensePlateGroup[] = [];
  @Input() activeSection: string = '';
  @Output() sectionClicked = new EventEmitter<string>();

  constructor(private mapStateService: MapStateService) {}

  onSectionClick(section: string): void {
    this.sectionClicked.emit(section);
  }

  isActive(section: string): boolean {
    return this.activeSection === section;
  }

  getStateClass(stateName: string): string {
    return this.mapStateService.getStateClass(stateName);
  }
}
