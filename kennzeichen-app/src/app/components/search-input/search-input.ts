import { Component, Input, Output, EventEmitter, forwardRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { LocalStorageService } from '../../services/local-storage';

@Component({
  selector: 'app-search-input',
  imports: [FormsModule, CommonModule],
  templateUrl: './search-input.html',
  styleUrl: './search-input.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchInput),
      multi: true
    }
  ]
})
export class SearchInput implements ControlValueAccessor {
  @Output() searchChange = new EventEmitter<string>();
  @Output() inputChange = new EventEmitter<string>();
  @Output() seenClick = new EventEmitter<string>();

  @Input() value: string = '';
  @Input() seenCodes$!: Observable<Set<string>>;
  disabled: boolean = false;

  localStorageService = inject(LocalStorageService);

  @Input() set externalValue(val: string) {
    if (val !== this.value) {
      this.value = val;
    }
  }

  private onChange = (value: string) => {};
  private onTouched = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value; // Remove character limit and uppercase constraint

    this.value = value;
    this.onChange(value);
    this.searchChange.emit(value);
    this.inputChange.emit(value);
  }

  onBlur(): void {
    this.onTouched();
  }

  onClear(): void {
    this.value = '';
    this.onChange('');
    this.searchChange.emit('');
    this.inputChange.emit('');
  }

  onSeen(): void {
    this.seenClick.emit(this.value);
    this.onClear();
  }

  getSeenButtonText(): string {
    if (!this.value) {
      return 'Gesehen?';
    }

    const code = this.value.toUpperCase();
    const seenDate = this.localStorageService.getSeenDate(code);

    if (!seenDate) {
      return 'Gesehen?';
    }

    const seenDateObj = new Date(seenDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time parts for comparison
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    seenDateObj.setHours(0, 0, 0, 0);

    if (seenDateObj.getTime() === today.getTime()) {
      return 'Heute schon gesehen';
    } else if (seenDateObj.getTime() === yesterday.getTime()) {
      return 'Gestern schon gesehen';
    } else {
      // Calculate days ago
      const diffTime = today.getTime() - seenDateObj.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 2) {
        return 'Vorgestern schon gesehen';
      } else if (diffDays <= 7) {
        return `Vor ${diffDays} Tagen schon gesehen`;
      } else {
        const day = seenDateObj.getDate().toString().padStart(2, '0');
        const month = (seenDateObj.getMonth() + 1).toString().padStart(2, '0');
        return `Am ${day}.${month}. schon gesehen`;
      }
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
