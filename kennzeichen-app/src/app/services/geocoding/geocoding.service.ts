import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { CityCoordinates, GeocodeQueueItem, cacheKey } from './geocoding.types';
import { delay, requestCityCoordinates } from './geocoding-request';

export type { CityCoordinates };

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private cache = new Map<string, CityCoordinates>();
  private requestQueue: GeocodeQueueItem[] = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minRequestInterval = 3000;

  constructor(private http: HttpClient) {
    this.loadStaticCoordinates();
  }

  private loadStaticCoordinates() {
    this.http.get<CityCoordinates[]>('german-cities-complete.json').subscribe((cities) => {
      cities.forEach((city) => {
        this.cache.set(cacheKey(city.name, city.state), city);
      });
    });
  }

  getCoordinatesSync(cityName: string, stateName?: string): CityCoordinates | null {
    return this.cache.get(cacheKey(cityName, stateName)) || null;
  }

  getCoordinates(cityName: string, stateName?: string): Observable<CityCoordinates | null> {
    const key = cacheKey(cityName, stateName);
    if (this.cache.has(key)) return of(this.cache.get(key)!);

    return new Observable((observer) => {
      this.requestQueue.push({
        cityName,
        stateName,
        resolve: (result) => {
          observer.next(result);
          observer.complete();
        },
      });
      void this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      const timeToWait = this.minRequestInterval - (Date.now() - this.lastRequestTime);
      if (timeToWait > 0) await delay(timeToWait);

      try {
        request.resolve(
          await requestCityCoordinates(this.http, this.cache, request.cityName, request.stateName)
        );
        this.lastRequestTime = Date.now();
      } catch (error) {
        console.warn(`Failed to geocode ${request.cityName}:`, error);
        request.resolve(null);
      }
      await delay(500);
    }

    this.isProcessing = false;
  }

  getMultipleCoordinates(cities: { name: string; state?: string }[]): Observable<CityCoordinates[]> {
    const requests = cities.map((city) => this.getCoordinates(city.name, city.state));
    return new Observable((observer) => {
      Promise.all(requests.map((req) => req.toPromise()))
        .then((results) => {
          observer.next(results.filter((result) => result !== null) as CityCoordinates[]);
          observer.complete();
        })
        .catch((error) => {
          console.error('Error geocoding multiple cities:', error);
          observer.next([]);
          observer.complete();
        });
    });
  }
}
