import { Component, input, output, contentChild, TemplateRef } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'icon' | 'icon-small' | 'transparent';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  variant = input<ButtonVariant>('primary');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  ariaLabel = input<string>();

  clicked = output<Event>();

  onClick(event: Event): void {
    if (!this.disabled()) {
      this.clicked.emit(event);
    }
  }
}
