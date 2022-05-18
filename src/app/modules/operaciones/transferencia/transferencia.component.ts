import { EditTransferenciaComponent } from './edit-transferencia/edit-transferencia.component';
import { TabService, TabData } from './../../../layouts/tab/tab.service';
import { Component, OnInit } from '@angular/core';
import { Tab } from '../../../layouts/tab/tab.model';
import { dateToString } from '../../../commons/core/utils/dateUtils';

@Component({
  selector: 'app-transferencia',
  templateUrl: './transferencia.component.html',
  styleUrls: ['./transferencia.component.scss']
})
export class TransferenciaComponent implements OnInit {

  constructor(private tabService: TabService) { }

  ngOnInit(): void {

  }

  onListTransferencias(){

  }

  onNuevaTransferencia(){
    this.tabService.addTab(new Tab(EditTransferenciaComponent, 'Transferencia 1', new TabData(1), TransferenciaComponent))
  }

}
