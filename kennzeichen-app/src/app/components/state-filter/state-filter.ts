import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-state-filter',
  imports: [CommonModule, FormsModule],
  templateUrl: './state-filter.html',
  styleUrl: './state-filter.scss'
})
export class StateFilter {
  @Output() stateChange = new EventEmitter<string>();

  selectedState = '';

  germanStates = [
    'Baden-Württemberg',
    'Bayern',
    'Berlin',
    'Brandenburg',
    'Bremen',
    'Hamburg',
    'Hessen',
    'Mecklenburg-Vorpommern',
    'Niedersachsen',
    'Nordrhein-Westfalen',
    'Rheinland-Pfalz',
    'Saarland',
    'Sachsen',
    'Sachsen-Anhalt',
    'Schleswig-Holstein',
    'Thüringen'
  ];

  onStateChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedState = target.value;
    this.stateChange.emit(this.selectedState);
  }

  clearFilter(): void {
    this.selectedState = '';
    this.stateChange.emit('');
  }
}