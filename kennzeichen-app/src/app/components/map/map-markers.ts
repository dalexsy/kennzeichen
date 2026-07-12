import * as L from 'leaflet';
import { GeocodingService, CityCoordinates } from '../../services/geocoding';
import { LicensePlate } from '../../models/license-plate.interface';
import { MapStateService } from '../../services/map-state.service';
import { MapMarkerService } from '../../services/map-marker.service';

export interface MapMarkerHost {
  map: L.Map | null;
  markers: Map<string, L.Marker>;
  selectedMarker: L.Marker | null;
  hasMarkers: boolean;
  selectedCode: string;
  licensePlates: LicensePlate[];
  geocodingService: GeocodingService;
  mapStateService: MapStateService;
  mapMarkerService: MapMarkerService;
  onCodeSelected(plate: LicensePlate): void;
  onMapClose(): void;
}

export function handleSelectedCodeChange(host: MapMarkerHost): void {
  if (host.selectedCode) {
    const hasFilteredMarkers = host.licensePlates.length <= 200;

    if (hasFilteredMarkers && host.markers.size > 1) {
      highlightSelectedMarker(host);
    } else {
      clearMarkers(host);
      const selectedPlate = host.licensePlates.find((p) => p.code === host.selectedCode);
      if (selectedPlate) {
        loadSingleMarker(host, selectedPlate);
      }
    }
  } else {
    const hasFilteredMarkers = host.licensePlates.length <= 200;
    if (!hasFilteredMarkers || host.markers.size <= 1) {
      clearMarkers(host);
      if (host.map) {
        host.mapMarkerService.fitMapToMarkers(host.map, host.markers);
      }
    } else {
      highlightSelectedMarker(host);
    }
  }
}

export function loadLicensePlateLocations(host: MapMarkerHost): void {
  if (!host.licensePlates.length || !host.map) return;

  const cities = host.licensePlates
    .filter((plate) => plate.derived_from && plate.derived_from !== 'willkürlich gewählt')
    .map((plate) => ({
      name: plate.derived_from,
      state: plate.federal_state,
      plate,
    }))
    .filter(
      (city, index, array) =>
        array.findIndex((c) => c.name === city.name && c.state === city.state) === index
    );

  cities.forEach((city) => {
    const coordinates = host.geocodingService.getCoordinatesSync(city.name, city.state);
    if (coordinates && host.map) {
      addMarker(host, coordinates, city.plate);
    } else {
      console.log(
        `Missing coordinates for:\n  {\n    "name": "${city.name || ''}",\n    "lat": ,\n    "lng": ,\n    "state": "${city.state || ''}"\n  }`
      );
    }
  });
}

export function loadSingleMarker(host: MapMarkerHost, plate: LicensePlate): void {
  if (!plate.derived_from || plate.derived_from === 'willkürlich gewählt' || !host.map) {
    return;
  }

  const coordinates = host.geocodingService.getCoordinatesSync(
    plate.derived_from,
    plate.federal_state
  );
  if (coordinates && host.map) {
    addMarker(host, coordinates, plate);
    host.map.panTo([coordinates.lat, coordinates.lng]);
    host.hasMarkers = true;
  } else {
    console.log(
      `Missing coordinates for:\n  {\n    "name": "${plate.derived_from || ''}",\n    "lat": ,\n    "lng": ,\n    "state": "${plate.federal_state || ''}"\n  }`
    );
  }
}

export function addMarker(
  host: MapMarkerHost,
  coordinates: CityCoordinates,
  licensePlate: LicensePlate
): void {
  if (!host.map) return;

  const isSelected = host.selectedCode === licensePlate.code;
  const marker = host.mapMarkerService.createMarker(
    coordinates,
    licensePlate,
    isSelected,
    (plate: LicensePlate) => {
      host.onCodeSelected(plate);
      host.onMapClose();
    }
  );

  marker.addTo(host.map);

  if (isSelected) {
    marker.openPopup();
    host.selectedMarker = marker;
    host.map.panTo([coordinates.lat, coordinates.lng]);
  }

  host.markers.set(licensePlate.code, marker);
}

export function highlightSelectedMarker(host: MapMarkerHost): void {
  host.markers.forEach((marker, code) => {
    const isSelected = code === host.selectedCode;
    const plate = host.licensePlates.find((p) => p.code === code);
    const stateClass = plate ? host.mapStateService.getStateClass(plate.federal_state) : '';

    host.mapMarkerService.updateMarkerIcon(marker, code, isSelected, stateClass);

    if (isSelected) {
      marker.openPopup();
      host.selectedMarker = marker;
      if (host.map) {
        host.map.panTo(marker.getLatLng());
      }
    } else {
      marker.closePopup();
    }
  });

  if (!host.selectedCode) {
    host.selectedMarker = null;
  }
}

export function clearMarkers(host: MapMarkerHost): void {
  host.markers.forEach((marker) => {
    if (host.map) {
      host.map.removeLayer(marker);
    }
  });
  host.markers.clear();
  host.selectedMarker = null;
  host.hasMarkers = false;
}

export function refreshMap(host: MapMarkerHost): void {
  clearMarkers(host);
  loadLicensePlateLocations(host);
  host.hasMarkers = host.markers.size > 0;
}