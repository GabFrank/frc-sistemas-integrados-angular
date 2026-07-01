import { EditTransferenciaComponent } from './edit-transferencia/edit-transferencia.component';
import { TabService } from './../../../layouts/tab/tab.service';
import { Component, OnInit } from '@angular/core';
import { Tab } from '../../../layouts/tab/tab.model';
import { ListTransferenciaComponent } from './list-transferencia/list-transferencia.component';
import { EntregadoresComponent } from './entregadores/entregadores.component';
import { ConfiguracionTransferenciaDialogComponent } from './configuracion-transferencia-dialog/configuracion-transferencia-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MainService } from '../../../main.service';
import { ROLES } from '../../personas/roles/roles.enum';

@Component({
  selector: 'app-transferencia',
  templateUrl: './transferencia.component.html',
  styleUrls: ['./transferencia.component.scss']
})
export class TransferenciaComponent implements OnInit {
  readonly ROLES = ROLES;
  constructor(private tabService: TabService, private matDialog: MatDialog, public mainService: MainService) { }

  ngOnInit(): void {

  }

  onListTransferencias() {
    this.tabService.addTab(new Tab(ListTransferenciaComponent, 'Lista de transferencias', null, TransferenciaComponent))
  }

  onNuevaTransferencia() {
    this.tabService.addTab(new Tab(EditTransferenciaComponent, 'Nueva transferencia', null, TransferenciaComponent))
  }

  onEntregadores() {
    this.tabService.addTab(new Tab(EntregadoresComponent, 'Entregadores', null, TransferenciaComponent))
  }

  onAbrirConfiguracion() {
    this.matDialog.open(ConfiguracionTransferenciaDialogComponent, {
      width: '560px',
      disableClose: false,
      panelClass: 'custom-dialog-container'
    });
  }
}
