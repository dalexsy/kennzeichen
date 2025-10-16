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

  getStateColor(stateName: string): string | undefined {
    const index = this.stateIndexMap.get(stateName);
    if (index === undefined) return undefined;

    // These colors match the state-colors mixin in _state-colors.scss
    const colors = [
      '#a14c2e', // state-0: Baden-Württemberg
      '#b35c37', // state-1: Bayern
      '#c56f3a', // state-2: Berlin
      '#d6833d', // state-3: Brandenburg
      '#e79a40', // state-4: Bremen
      '#e9b643', // state-5: Hamburg
      '#c9b747', // state-6: Hessen
      '#a1a74c', // state-7: Mecklenburg-Vorpommern
      '#7e9454', // state-8: Niedersachsen
      '#5f805a', // state-9: Nordrhein-Westfalen
      '#4e6f62', // state-10: Rheinland-Pfalz
      '#4a616c', // state-11: Saarland
      '#565a77', // state-12: Sachsen
      '#64567e', // state-13: Sachsen-Anhalt
      '#72567c', // state-14: Schleswig-Holstein
      '#7f5578'  // state-15: Thüringen
    ];

    return colors[index];
  }
}