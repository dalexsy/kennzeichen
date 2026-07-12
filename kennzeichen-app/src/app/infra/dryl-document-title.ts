import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
} from '@angular/core';
import { TitleStrategy } from '@angular/router';
import { DrylTitleStrategy } from './dryl-title-strategy';

export const DRYL_SITE_TITLE = new InjectionToken<string>('DRYL_SITE_TITLE', {
  factory: () => readSiteTitleFromWindow() ?? 'dryl',
});

export function formatDrylDocumentTitle(
  pageTitle: string | undefined,
  siteName: string,
  brand = 'dryl.io',
): string {
  const site = siteName.trim();
  const page = pageTitle?.trim();
  const suffix = brand.trim();
  if (page && page.localeCompare(site, undefined, { sensitivity: 'accent' }) !== 0) {
    return `${page} | ${site} | ${suffix}`;
  }
  return `${site} | ${suffix}`;
}

export function provideDrylDocumentTitle(siteName: string): EnvironmentProviders {
  const label = siteName.trim();
  return makeEnvironmentProviders([
    { provide: DRYL_SITE_TITLE, useValue: label },
    { provide: TitleStrategy, useClass: DrylTitleStrategy },
  ]);
}

function readSiteTitleFromWindow(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const value = (window as Window & { __DRYL_SITE_TITLE__?: string }).__DRYL_SITE_TITLE__;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}