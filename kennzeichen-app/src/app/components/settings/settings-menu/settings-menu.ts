import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Translations } from '../../../services/localization/localization-translations';

@Component({
  selector: 'app-settings-menu',
  imports: [CommonModule],
  templateUrl: './settings-menu.html',
  styleUrl: './settings-menu.scss',
})
export class SettingsMenu {
  @Input() translations$!: Observable<Translations>;
  @Input() languageLabel = '';
  @Input() themeLabel = '';
  @Output() closed = new EventEmitter<void>();
  @Output() languageToggle = new EventEmitter<void>();
  @Output() themeCycle = new EventEmitter<void>();
  @Output() syncOpen = new EventEmitter<void>();
}
