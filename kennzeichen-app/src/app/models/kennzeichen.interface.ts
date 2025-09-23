export interface LicensePlate {
  code: string;
  city_district: string;
  derived_from: string;
  federal_state: string;
}

export interface LicensePlateData {
  license_plates: LicensePlate[];
  metadata: {
    source: string;
    description: string;
    last_updated: string;
    note: string;
  };
}

export interface LicensePlateWithSeen extends LicensePlate {
  seen?: boolean;
  seenAt?: Date;
}