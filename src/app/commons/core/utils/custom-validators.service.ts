import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class CustomValidatorsService {
  constructor() {}

  public noWhitespaceValidator(control: FormControl) {
    if(control.dirty && control.value!=null){
      const isWhitespace = (control.value || '').trim().length === 0;
      const isTouched = control.touched
      const isValid = !isWhitespace;
      return isValid ? null : { whitespace: true };
    }
  }
}
