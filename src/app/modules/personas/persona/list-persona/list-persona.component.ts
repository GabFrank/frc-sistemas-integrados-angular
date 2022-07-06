import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TabService } from '../../../../layouts/tab/tab.service';
import { WindowInfoService } from '../../../../shared/services/window-info.service';
import { AdicionarUsuarioDialogComponent } from '../../usuarios/adicionar-usuario-dialog/adicionar-usuario-dialog.component';
import { AdicionarPersonaDialogComponent } from '../adicionar-persona-dialog/adicionar-persona-dialog.component';
import { Persona } from '../persona.model';
import { PersonaService } from '../persona.service';



@UntilDestroy()
@Component({
  selector: 'app-list-persona',
  templateUrl: './list-persona.component.html',
  styleUrls: ['./list-persona.component.css'],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class ListPersonaComponent implements OnInit {

  @ViewChild('buscar', { static: true }) buscar: ElementRef;

  dataSource = new MatTableDataSource<Persona>([]);
  selectedPersona: Persona;
  displayedColumns: string[] = [
    'id',
    'nombre',
    'apodo',
    'documento',
    'nacimiento',
    'telefono',
    'creadoEn',
    'acciones'
  ];

  expandedPersona: Persona;

  page = -1;
  isLastPage = false;
  isSearching = false;

  buscarControl = new FormControl(null, Validators.required)

  constructor(
    public service: PersonaService,
    public windowInfoService: WindowInfoService,
    private matDialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.cargarMasDatos()
  }

  rowSelectedEvent(e) {
  }

  onFiltrar() {
    this.dataSource.data = []
    if (this.buscarControl.valid) {
      this.isSearching = true;
      this.service.onSearch(this.buscarControl.value)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.isSearching = false;
          this.isLastPage = true;
          this.buscar.nativeElement.select()
          this.dataSource.data = res;
        })
    } else {
      this.page = -1;
      this.isLastPage = false;
      this.cargarMasDatos()
    }
  }

  onAddPersona(persona?: Persona, index?) {
    this.matDialog.open(AdicionarPersonaDialogComponent, {
      data: {
        persona
      },
      width: '60%',
    })
  }

  cargarMasDatos() {
    this.isSearching = true;
    this.page++;
    this.service.onGetAll(this.page)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res.length == 0) this.isLastPage = true;
        this.isSearching = false;
        this.dataSource.data = this.dataSource.data.concat(res)
      })
  }

  irA(opcion, persona) {
    switch (opcion) {
      case 'usuario':
        this.abrirUsuario(persona)
        break;
      case 'cliente':
        this.abrirCliente(persona)
        break;
      case 'funcionario':
        this.abrirFuncionario(persona)
        break;
      case 'proveedor':
        this.abrirProveedor(persona)
        break;
    }
  }

  abrirUsuario(persona) {
    this.matDialog.open(AdicionarUsuarioDialogComponent, {
      data : {personaId: persona?.id},
      width: '60%'
    })
  }

  abrirCliente(persona) {

  }

  abrirFuncionario(persona) {

  }

  abrirProveedor(persona) {

  }
}
