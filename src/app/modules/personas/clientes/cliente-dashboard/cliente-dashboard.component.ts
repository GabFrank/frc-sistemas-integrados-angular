import { Component, OnInit } from '@angular/core';
import { TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { BotonData } from '../../../../shared/components/boton/boton.component';
import { ListClientesComponent } from '../list-clientes/list-clientes.component';
import { Tab } from '../../../../layouts/tab/tab.model';
import { AddClienteDialogComponent } from '../add-cliente-dialog/add-cliente-dialog.component';

@Component({
  selector: 'app-cliente-dashboard',
  templateUrl: './cliente-dashboard.component.html',
  styleUrls: ['./cliente-dashboard.component.scss']
})
export class ClienteDashboardComponent implements OnInit {

  botonesList: BotonData[];

  constructor(
    public mainService: MainService,
    private tabService: TabService,
  ) {
  }

  ngOnInit(): void {
    this.crearBotones()
  }

  crearBotones() {
    this.botonesList = []
    this.botonesList.push(
      {
        nombre: 'Lista de clientes',
        clickEvent: 'list-clientes',
        icon: 'groups',
        iconSize: 4,
        expression: false
      }
      // ,
      // {
      //   nombre: 'Funcionarios',
      //   clickEvent: 'list-funcionarios',
      //   icon: 'badge',
      //   iconSize: 4,
      //   expression: false
      // },
      // {
      //   nombre: 'Proveedores',
      //   clickEvent: 'list-proveedores',
      //   icon: 'supervisor_account',
      //   iconSize: 4,
      //   expression: false
      // },
      // {
      //   nombre: 'Usuarios',
      //   clickEvent: 'list-usuarios',
      //   icon: 'person',
      //   iconSize: 4,
      //   expression: false
      // }
    )
  }

  goTo(func) {
    switch (func) {
      case 'list-clientes':
        this.onListClientes()
        break;
      case 'new-cliente':
        this.onNewCliente()
        break;
    }
  }

  onListClientes(){
    this.tabService.addTab(new Tab(ListClientesComponent, "Lista de clientes", null, ClienteDashboardComponent))
  }

  onNewCliente(){
    this.tabService.addTab(new Tab(AddClienteDialogComponent, "Nuevo cliente", null, ClienteDashboardComponent))
  }
}
