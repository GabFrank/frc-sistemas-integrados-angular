import { Component, OnInit } from '@angular/core';
import { Tab } from '../../../layouts/tab/tab.model';
import { TabService } from '../../../layouts/tab/tab.service';
import { MainService } from '../../../main.service';
import { BotonData } from '../../../shared/components/boton/boton.component';
import { ListFuncioarioComponent } from '../funcionarios/list-funcioario/list-funcioario.component';
import { ListPreRegistroFuncionarioComponent } from '../funcionarios/list-pre-registro-funcionario/list-pre-registro-funcionario.component';
import { ListPersonaComponent } from '../persona/list-persona/list-persona.component';
import { ListProveedorComponent } from '../proveedor/list-proveedor/list-proveedor.component';
import { ListUsuarioComponent } from '../usuarios/list-usuario/list-usuario.component';

@Component({
  selector: 'app-personas-dashboard',
  templateUrl: './personas-dashboard.component.html',
  styleUrls: ['./personas-dashboard.component.scss']
})
export class PersonasDashboardComponent implements OnInit {

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
        nombre: 'Personas',
        clickEvent: 'list-personas',
        icon: 'groups',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Clientes',
        clickEvent: 'list-clientes',
        icon: 'account_circle',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Funcionarios',
        clickEvent: 'list-funcionarios',
        icon: 'badge',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Proveedores',
        clickEvent: 'list-proveedores',
        icon: 'supervisor_account',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Usuarios',
        clickEvent: 'list-usuarios',
        icon: 'person',
        iconSize: 4,
        expression: false
      }
    )
  }






  goTo(func) {
    switch (func) {
      case 'list-personas':
        this.onListPersonas()
        break;
      case 'list-clientes':
        this.onListClientes()
        break;
      case 'list-funcionarios':
        this.onListFuncionarios()
        break;
      case 'list-proveedores':
        this.onListProveedores()
        break;
      case 'list-usuarios':
        this.onListUsuarios()
        break;
    }
  }

  onListClientes() {
    // this.tabService.addTab(new Tab(ListClientes, 'Lista de funcionarios'))
  }

  onListFuncionarios() {
    this.tabService.addTab(new Tab(ListFuncioarioComponent, 'Lista de funcionarios'))
  }


  onListProveedores() {
    this.tabService.addTab(new Tab(ListProveedorComponent, 'Lista de solicitudes'))
  }

  onListUsuarios() {
    this.tabService.addTab(new Tab(ListUsuarioComponent, 'Lista de funcionarios'))
  }

  onListPersonas() {
    this.tabService.addTab(new Tab(ListPersonaComponent, 'Lista de personas'))

  }

}
