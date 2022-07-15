import { EditTransferenciaComponent } from './edit-transferencia/edit-transferencia.component';
import { TabService } from './../../../layouts/tab/tab.service';
import { Component, OnInit } from '@angular/core';
import { Tab } from '../../../layouts/tab/tab.model';

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
    this.tabService.addTab(new Tab(EditTransferenciaComponent, 'Nueva transferencia', null, TransferenciaComponent))
  }

}
