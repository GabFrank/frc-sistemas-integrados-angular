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
import { WindowInfoService } from '../../services/window-info.service';

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

export class GenericListComponent implements OnInit {

  @Input()
  titulo: string;

  @Output()
  adicionar = new EventEmitter<any>(null);

  @Output()
  filtrar = new EventEmitter<any>(null);

  @Output()
  resetFiltro = new EventEmitter<any>(null);

  headerHeight;
  tableHeight;
  containerHeight;

  constructor(
    public windowInfoService: WindowInfoService,
  ) { 
    this.headerHeight = windowInfoService.innerTabHeight * 0.2;
    this.tableHeight = windowInfoService.innerTabHeight * 0.8;
    this.containerHeight = windowInfoService.innerTabHeight;
  }

  ngOnInit(): void {
    
  }

  onAdd(){
    this.adicionar.emit()
  }

  onCancel(){
    this.filtrar.emit()
  }

  onFiltrar(){
    
  }

  onResetFiltro(){
    this.resetFiltro.emit()
  }

  
}
