export interface Kennzeichen {
  code: string;
  city_district: string;
  derived_from: string;
  federal_state: string;
}

export interface KennzeichenData {
  license_plates: Kennzeichen[];
  metadata: {
    source: string;
    description: string;
    last_updated: string;
    note: string;
  };
}

export interface KennzeichenWithSeen extends Kennzeichen {
  seen?: boolean;
  seenAt?: Date;
}