import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDatepicker } from '@angular/material/datepicker';
import { dateToString } from '../../../commons/core/utils/dateUtils';

/**
 * FrcMultiDatepickerComponent provides a multiple date selection control.
 * It uses the MatDatepicker component to allow users to select/deselect multiple dates.
 * The selected dates are displayed in a text input field, separated by commas.
 * A clear button allows the user to clear all selected dates at once.
 * 
 * @example
 * <frc-multi-datepicker
 *   [initialDates]="arrayOfDates"
 *   [titulo]="'Fecha(s)'"
 *   (datesChanged)="handleDatesChange($event)"
 * ></frc-multi-datepicker>
 * 
 * @Input() initialDates - An array of dates that should be initially selected.
 * @Input() titulo - A string to be used as the label for the control.
 * @Output() datesChanged - An event that will be emitted when the selected dates change.
 *                          The array of selected dates will be passed as an argument.
 * 
 * @autor Gabriel Franco
 */
@Component({
  selector: 'frc-multi-datepicker',
  templateUrl: './frc-multi-datepicker.component.html',
  styleUrls: ['./frc-multi-datepicker.component.scss']
})
export class FrcMultiDatepickerComponent implements OnInit {

  @ViewChild('picker') picker: MatDatepicker<Date>;

  @Input() initialDates: Date[] = [];
  @Input() titulo: string = 'Fecha(s)'
  @Output() datesChanged = new EventEmitter<Date[]>();

  dateControl = new FormControl(null);
  displayDateControl = new FormControl(null);

  selectedDates: Date[] = [];

  ngOnInit() {
    this.selectedDates = this.initialDates;
    this.updateDisplayDates();
  }

  addEvent(event) {
    let text = '';
    let date = event.value;
    if (!this.selectedDates.find(d => this.compareDates(d, date))) {
      console.log('no encontro fecha igual, haciendo push');
      this.selectedDates.push(date);
    } else {
      console.log('encontro una fecha igual, vamos a remover');
      this.selectedDates = this.selectedDates.filter(d => !this.compareDates(d, date));
    }
    this.updateDisplayDates();

    setTimeout(() => this.picker.open(), 0);
  }

  compareDates(d1: Date, d2: Date) {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  }

  dateClass = (date: Date) => {
    if (this.selectedDates?.find(d => this.compareDates(d, date))) {
      return ['selected'];
    }
    return [];
  }

  clearDates() {
    this.dateControl.setValue(null)
    this.selectedDates = [];
    this.displayDateControl.setValue(null)
  }

  updateDisplayDates() {
    let text = '';
    this.selectedDates.forEach((f, i) => {
      if (i <= this.selectedDates.length) {
        text = text + dateToString(f, 'dd/MM/yyyy') + ', ';
      } else {
        text = text + dateToString(f, 'dd/MM/yyyy');
      }
    });
    this.displayDateControl.setValue(text);

    this.emitDates();
  }

  emitDates() {
    this.datesChanged.emit(this.selectedDates);
  }

}
