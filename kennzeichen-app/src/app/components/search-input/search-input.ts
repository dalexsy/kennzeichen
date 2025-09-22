import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

  @Input() value: string = '';
  disabled: boolean = false;

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
