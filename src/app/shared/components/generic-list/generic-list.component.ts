import { Component, OnInit, ViewChild, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatInput } from '@angular/material/input';
import { MatSort } from '@angular/material/sort';
import { Subscription } from 'rxjs';
import { Apollo } from 'apollo-angular';
import { MatTableDataSource } from '@angular/material/table';
import { MatCheckbox } from '@angular/material/checkbox';
import { GenericListService } from './generic-list.service';
import { GenericListInterface } from './generic-list-interface';
import { Observable } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDatepicker, MatDateRangeInput, MatDateRangePicker, MatEndDate, MatStartDate } from '@angular/material/datepicker';
import { TabService } from '../../../layouts/tab/tab.service';

export interface DisplayedLinkData {
  el: any;
  service: GenericListService;
  item: string;
  dialogComponent: any;
}

export interface DialogDetailData{
  data: DisplayedLinkData;
}
@Component({
  selector: 'app-generic-list',
  templateUrl: './generic-list.component.html',
  styleUrls: ['./generic-list.component.css']
})

export class GenericListComponent implements OnInit, OnDestroy {

  loading = true;
  error: any;
  dataSource;
  dsData: any;
  list = true;
  searchText = '';

  @Input()
  displayedColumnsId: string[];
  @Input()
  displayedColumns: string[];
  @Input()
  displayedLinks: any[];
  @Input()
  displayedColumnsSize: number[];
  @Input()
  service: GenericListService;

  @Output()
  editEvent = new EventEmitter<any>();

  @Output()
  newEvent = new EventEmitter<any>();

  @Output()
  linkClickEvent = new EventEmitter<any>();

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild('searchInput', { static: true }) searchInput: MatInput;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild('mostrarTodosCheckbox', { static: true }) matCheckBox: MatCheckbox;

  private searchQuerySubscription: Subscription;

  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl()
  });

  constructor(
    private tabService: TabService,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.service.datosSub.subscribe(datos => {
      this.dataSource = datos;
    });
    this.displayedColumnsId[this.displayedColumnsId.length] = 'accion';

    this.range.get('start').valueChanges.subscribe(res=>{
      this.onDateRangeSearch();
    })
    this.range.get('end').valueChanges.subscribe(res=>{
      this.onDateRangeSearch();
    })
  }

  onEdit(obj): void {
    this.service.onEdit(obj, this.service.entityQuery, this.service.component, this.service.editTitle, this.service.parentComponent);
  }

  add(): void {
    this.service.add(this.service.component, this.service.newTitle, this.service.parentComponent);
  }

  onDelete(e): void{
    this.service.onDelete(e, this.service.deleteTitle, this.service.deleteQuery);
  }

  onSearchChange(e: Event, text?): void {
    console.log(this.matCheckBox.checked)
    if(e != null){
      (e.target as HTMLInputElement).value
    }
    if (this.matCheckBox.checked){
      const data = this.service.onAllEntitiesQuery(this.service.allEntitiesQuery);
      // text = '%';
    } else {
      const data = this.service.onSearch((e.target as HTMLInputElement).value, this.service.searchQuery, this.sort);
    }
  }

  onDateRangeSearch(){
    if(this.range.get('start').value!=null){
      this.matCheckBox.checked = false;
      console.log(this.range.get('start').value)
      const data = this.service.onDateRangeSeach(this.range.get('start').value, this.range.get('end').value, this.service.dataRangeQuery);

    }
  }

  onTableScroll(e): void {
  }

  onMostrarTodosChange(): void{
    let e = '';
    if (this.matCheckBox.checked){
      e = '%';
      this.range.get('start').setValue(null);
      this.range.get('end').setValue(null);
      this.searchInput.value = '';
    } else {
      e = '';
    }
    this.onSearchChange(null, e);
  }

  ngOnDestroy(): void{
    this.service.onDestroy();
  }

  onSelectedRow(row){
    this.service.onEdit(row, this.service.entityQuery, this.service.component, this.service.editTitle , this.service.parentComponent, this.service.preTitle);
  }

  onLinkClick(el, data: DisplayedLinkData){
    data.el = el;
    this.dialog.open(data.dialogComponent, {
        data
    });

  }
}
