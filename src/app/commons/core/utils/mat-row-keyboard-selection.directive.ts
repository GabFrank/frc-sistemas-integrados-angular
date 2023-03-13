import {SelectionModel} from '@angular/cdk/collections';
import {Directive, ElementRef, Host, HostListener, Input, OnDestroy, OnInit, Self, AfterViewInit} from '@angular/core';
import { MatTableDataSource, MatTable, MatRow } from '@angular/material/table';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Directive({
  selector: '[matRowKeyboardSelection]'
})
export class MatRowKeyboardSelectionDirective implements OnInit, OnDestroy, AfterViewInit {

  
  private dataSource: MatTableDataSource<any>;
  private rows: NodeListOf<HTMLElement>;
  private renderedData: any[];

  @Input('matRowKeyboardSelection') set MatRowKeyboardSelection(selection) {
    this.selection = selection;
  }

  @Input() selection: SelectionModel<any>;
  @Input() rowModel;
  @Input() toggleOnEnter = true;
  @Input() selectOnFocus = true;
  @Input() deselectOnBlur = false;
  @Input() preventNewSelectionOnTab = false;
  @Input() matTable: MatTable<any>;
  @Input() row: MatRow;

  private unsubscriber$ = new Subject();



// @Host() private matTable: MatTable<any>
// @Host() @Self() private row: MatRow
  constructor(private el: ElementRef) {}

  ngOnInit(): void {
  
  }

  ngAfterViewInit() {
  // if (!this.selection) {
  //     throw new Error('Attribute \'selection\' is required');
  //   }
    if (!this.matTable || !this.matTable.dataSource) {
      throw new Error('MatTable [dataSource] is required');
    }
    if (!this.rowModel) {
      throw new Error('[rowModel] is required');
    }
    if (this.el.nativeElement.tabIndex < 0) {
      this.el.nativeElement.tabIndex = 0;
    }
    this.dataSource = this.matTable.dataSource as MatTableDataSource<any>;
    this.dataSource.connect().pipe(takeUntil(this.unsubscriber$)).subscribe(data => {
      this.renderedData = data;
      this.rows = this.getTableRows();
    });
  }

  ngOnDestroy(): void {
    this.unsubscriber$.next(true);
    this.unsubscriber$.complete();
  }

  @HostListener('focus', ['$event']) onFocus() {
    if (this.selectOnFocus && !this.selection.isMultipleSelection()) {
      this.selection.select(this.rowModel);
    }

    if (this.selectOnFocus && this.preventNewSelectionOnTab) {
      this.rows.forEach(row => {
        if (row !== this.el.nativeElement) {
          row.tabIndex = -1;
        }
      });
    }
  }

  @HostListener('blur', ['$event']) onBlur() {
    if (this.deselectOnBlur && !this.selection.isMultipleSelection()) {
      this.selection.deselect(this.rowModel);
    }
    if (this.selectOnFocus) {
      this.el.nativeElement.tabIndex = 0;
    }
  }

  @HostListener('keydown', ['$event']) onKeydown(event: KeyboardEvent) {
      let newRow;
      const currentIndex = this.renderedData.findIndex(row => row === this.rowModel);
      if (event.key === 'ArrowDown') {
        newRow = this.rows[currentIndex + 1];
      } else if (event.key === 'ArrowUp') {
        newRow = this.rows[currentIndex - 1];
      } else if (event.key === 'Enter' || event.key === ' ') {
        if (this.toggleOnEnter) {
          this.selection.toggle(this.rowModel);
        }
        event.preventDefault();
      }
      if (newRow) {
        newRow.focus();
      }
  }

  private getTableRows() {
    let el = this.el.nativeElement;
    while (el && el.parentNode) {
      el = el.parentNode;
      if (el.tagName && el.tagName.toLowerCase() === 'mat-table' || el.hasAttribute('mat-table')) {
        return el.querySelectorAll('mat-row, tr[mat-row]');
      }
    }
    return null;
  }

}
