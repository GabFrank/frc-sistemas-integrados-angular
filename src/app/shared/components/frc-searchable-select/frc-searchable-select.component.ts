import { Component, ContentChild, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { comparatorLike } from '../../../commons/core/utils/string-utils';
import { MatSelect } from '@angular/material/select';

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
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'frc-searchable-select',
  templateUrl: './frc-searchable-select.component.html',
  styleUrls: ['./frc-searchable-select.component.scss']
})
export class FrcSearchableSelectComponent implements OnInit, OnChanges {

  @ContentChild(TemplateRef) itemTemplate: TemplateRef<any>;  // <--- Here is the new ContentChild
  @ViewChild('matSelect') matSelect: MatSelect;

  control = new FormControl(null);
  filterControl = new FormControl(null, Validators.required);

  @Input() list: any[]; //lista desplegada
  @Output() selectionChanged = new EventEmitter<any>(); //evento de seleccion de un item
  @Output() inputChanged = new EventEmitter<any>(); //evento de input change
  @Input() titulo: string; //titulo del label
  @Input() isAdicionar: boolean; //boton de adicionar
  @Input() isAutoSelect: boolean = false; //auto seleccionar cuando solo hay una opcion
  @Input() autoSelectDelay: number = 1000; //tiempo de demora para auto seleccionar la opcion
  @Input() compareFields: any[] = []; //campos a comparar en el filtro
  @Input() initialValue: boolean = true; //valor inicial
  @Input() isMultiple: boolean = false; //multiple seleccion
  @Input() isFilter: boolean = true; //si el filtro sera realizado en el componte, si es un campo de busqueda en el servidor, desactivar filtro

  filteredList: any[];
  isLoading: boolean = true;
  autoSelectTimer: any;

  ngOnInit() {
    this.filteredList = this.list;
    this.filterControl.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      this.inputChanged.next(res)
      this.filterList();
    })
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes.list && changes.list.currentValue) {
      this.isLoading = false;
      this.filteredList = this.list;
      if (this.initialValue) {
        this.control.setValue(this.filteredList[0]);
        this.selectionChanged.emit(this.filteredList[0]);
      }
      // this.filterList();
    }
  }

  filterList() {
    if (!this.isFilter) return;
    if (this.isLoading) {
      return; // Skip filtering if data is not loaded yet
    }
    if (!this.list?.length) {
      return;
    }
    // get the search keyword
    let search: string = this.filterControl.value;
    if (!search) {
      this.filteredList = this.list;
      return;
    } else {
      search = search.toUpperCase();
    }
    // filter the entities
    this.filteredList = this.list.filter(item => {
      return this.compareFields.some(field => {
        console.log(field);

        if (field?.nested == null) {
          return comparatorLike(search, item[field]?.toString()?.toUpperCase())
        } else if (field?.nestedId != null) {
          return comparatorLike(search, item[field['nested']][field['nestedId']]?.toString()?.toUpperCase())
        }
      });
    });

    if (this.isAutoSelect && this.filteredList?.length == 1) {
      if (this.autoSelectTimer != null) {
        clearTimeout(this.autoSelectTimer)
      }
      setTimeout(() => {
        this.control.setValue(this.filteredList[0]);
        this.selectionChanged.emit(this.filteredList[0]);
        this.matSelect.close();
      }, this.autoSelectDelay);
    }
  }

  onSelectionChange(event) {
    this.selectionChanged.emit(event.value);
  }

  setFocus() {
    this.matSelect.focus()
  }
}
