import { Injectable } from '@angular/core';

export interface StateInfo {
  name: string;
  code: string;
  index: number;
}

/**
 * Service to manage German state data and provide state-related utilities.
 */
@Injectable({
  providedIn: 'root'
})
export class MapStateService {
  private stateIndexMap: Map<string, number> = new Map();
  public readonly states: StateInfo[] = [];

  constructor() {
    this.initializeStates();
  }

  private initializeStates(): void {
    const germanStatesData = [
      { name: 'Baden-Württemberg', code: 'BW' },
      { name: 'Bayern', code: 'BY' },
      { name: 'Berlin', code: 'BE' },
      { name: 'Brandenburg', code: 'BB' },
      { name: 'Bremen', code: 'HB' },
      { name: 'Hamburg', code: 'HH' },
      { name: 'Hessen', code: 'HE' },
      { name: 'Mecklenburg-Vorpommern', code: 'MV' },
      { name: 'Niedersachsen', code: 'NI' },
      { name: 'Nordrhein-Westfalen', code: 'NW' },
      { name: 'Rheinland-Pfalz', code: 'RP' },
      { name: 'Saarland', code: 'SL' },
      { name: 'Sachsen', code: 'SN' },
      { name: 'Sachsen-Anhalt', code: 'ST' },
      { name: 'Schleswig-Holstein', code: 'SH' },
      { name: 'Thüringen', code: 'TH' }
    ];

    germanStatesData.forEach((state, index) => {
      this.stateIndexMap.set(state.name, index);
      this.states.push({
        name: state.name,
        code: state.code,
        index: index
      });
    });
  }

  getStateClass(stateName: string): string {
    const index = this.stateIndexMap.get(stateName);
    return index !== undefined ? `state-${index}` : '';
  }

  getStateIndex(stateName: string): number | undefined {
    return this.stateIndexMap.get(stateName);
  }
}