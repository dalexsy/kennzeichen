import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { DRYL_SITE_TITLE, formatDrylDocumentTitle } from './dryl-document-title';

@Injectable()
export class DrylTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly siteName = inject(DRYL_SITE_TITLE);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot) ?? undefined;
    this.title.setTitle(formatDrylDocumentTitle(pageTitle, this.siteName));
  }
}