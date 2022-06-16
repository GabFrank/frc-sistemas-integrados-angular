import { Component, OnInit } from '@angular/core';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { BotonData } from '../../../../shared/components/boton/boton.component';
import { ListFuncioarioComponent } from '../list-funcioario/list-funcioario.component';
import { ListPreRegistroFuncionarioComponent } from '../list-pre-registro-funcionario/list-pre-registro-funcionario.component';

@Component({
  selector: 'app-funcionario-dashboard',
  templateUrl: './funcionario-dashboard.component.html',
  styleUrls: ['./funcionario-dashboard.component.scss']
})
export class FuncionarioDashboardComponent implements OnInit {

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
        nombre: 'Lista de funcionarios',
        clickEvent: 'list',
        icon: 'groups',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Nuevo funcionario',
        clickEvent: 'new',
        icon: 'badge',
        iconSize: 4,
        expression: false
      },
      {
        nombre: 'Lista de solicitudes',
        clickEvent: 'solicitudes',
        icon: 'article',
        iconSize: 4,
        expression: false
      }
    )
  }

  goTo(func) {
    switch (func) {
      case 'list':
        this.onListFuncionarios()
        break;
      case 'new':
        this.onNuevoFuncionario()
        break;
      case 'solicitudes':
        this.onListPreRegistros()
        break;
    }
  }

  onListFuncionarios() {
    this.tabService.addTab(new Tab(ListFuncioarioComponent, 'Lista de funcionarios'))
  }

  onNuevoFuncionario() {

  }

  onListPreRegistros() {
    this.tabService.addTab(new Tab(ListPreRegistroFuncionarioComponent, 'Lista de solicitudes'))
  }

}
