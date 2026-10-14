import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { WindowInfoService } from '../../../../shared/services/window-info.service';
import { AdicionarUsuarioDialogComponent, AdicionarUsuarioDialogData } from '../../usuarios/adicionar-usuario-dialog/adicionar-usuario-dialog.component';
import { AdicionarPersonaDialogComponent } from '../adicionar-persona-dialog/adicionar-persona-dialog.component';
import { Persona } from '../persona.model';
import { PersonaService } from '../persona.service';
import { UsuarioService } from '../../usuarios/usuario.service';
import { AddClienteDialogComponent, AdicionarClienteData } from '../../clientes/add-cliente-dialog/add-cliente-dialog.component';
import { ClienteService } from '../../clientes/cliente.service';
import { FuncionarioService } from '../../funcionarios/funcionario.service';
import { EditProveedorComponent, EditProveedorData, EditProveedorResult } from '../../proveedor/edit-proveedor/edit-proveedor.component';
import { ProveedorService } from '../../proveedor/proveedor.service';
import { LegajoFuncionarioComponent } from '../../../rrhh/legajo/legajo-funcionario/legajo-funcionario.component';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabData, TabService } from '../../../../layouts/tab/tab.service';



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
  @ViewChild(MatPaginator) paginator: MatPaginator;

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

  pageSize = 25;
  pageIndex = 0;
  selectedPageInfo: PageInfo<Persona>;
  timer: ReturnType<typeof setTimeout>;

  buscarControl = new FormControl(null)

  constructor(
    public service: PersonaService,
    public windowInfoService: WindowInfoService,
    private matDialog: MatDialog,
    private usuarioService: UsuarioService,
    private clienteService: ClienteService,
    private funcionarioService: FuncionarioService,
    private proveedorService: ProveedorService,
    private tabService: TabService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[1]);
      this.pageSize = this.paginator.pageSizeOptions[1];
      this.onFiltrar();
    }, 0);

    this.buscarControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.irAPrimeraPagina();
        if (this.timer != null) {
          clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
          this.onFiltrar();
        }, 500);
      });
  }

  rowSelectedEvent(e) {
  }

  onFiltrar() {
    const texto = this.buscarControl.value?.toString().trim() || null;
    this.service.onSearchConFiltros(texto, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.selectedPageInfo = res;
          this.dataSource.data = this.selectedPageInfo?.getContent || [];
        }
      })
  }

  resetFiltro() {
    this.irAPrimeraPagina();
    this.dataSource.data = [];
    this.selectedPageInfo = null;
    // No llamar onFiltrar aca: el valueChanges de buscarControl ya busca.
    this.buscarControl.setValue(null);
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  private irAPrimeraPagina() {
    this.pageIndex = 0;
    if (this.paginator) this.paginator.pageIndex = 0;
  }

  onAddPersona(persona?: Persona, index?) {
    this.matDialog.open(AdicionarPersonaDialogComponent, {
      data: {
        persona
      },
      width: '60%',
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.onFiltrar();
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

  abrirUsuario(persona: Persona) {
    if (!persona?.isUsuario) {
      this.abrirDialogoUsuario({ persona });
      return;
    }
    // «Ir a usuario»: se abre el usuario que ya tiene, no uno nuevo para la misma persona.
    this.usuarioService.onGetUsuarioPorPersonaId(persona.id)
      .pipe(untilDestroyed(this))
      .subscribe(usuario => {
        if (usuario != null) this.abrirDialogoUsuario({ usuario });
      })
  }

  private abrirDialogoUsuario(data: AdicionarUsuarioDialogData) {
    this.matDialog.open(AdicionarUsuarioDialogComponent, {
      data,
      width: '60%',
      height: '80%'
    })
  }

  abrirCliente(persona: Persona) {
    if (!persona?.isCliente) {
      this.abrirDialogoCliente({ persona });
      return;
    }
    this.clienteService.onGetByPersonaId(persona.id)
      .pipe(untilDestroyed(this))
      .subscribe(cliente => {
        if (cliente != null) this.abrirDialogoCliente({ cliente });
      })
  }

  private abrirDialogoCliente(data: AdicionarClienteData) {
    this.matDialog.open(AddClienteDialogComponent, {
      data,
      width: '60%',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.onFiltrar();
    })
  }

  abrirFuncionario(persona: Persona) {
    if (!persona?.isFuncionario) {
      // El alta de funcionarios vive en el legajo (igual que en la lista de funcionarios).
      this.tabService.addTab(new Tab(
        LegajoFuncionarioComponent,
        'Nuevo funcionario — ' + persona?.nombre,
        new TabData(null, { persona }),
        null
      ));
      return;
    }
    this.funcionarioService.onGetFuncionarioPorPersona(persona.id)
      .pipe(untilDestroyed(this))
      .subscribe(funcionario => {
        if (funcionario == null) return;
        // Título único por funcionario: el TabService deduplica por título.
        this.tabService.addTab(new Tab(
          LegajoFuncionarioComponent,
          'Legajo — ' + (persona?.nombre || ('#' + funcionario.id)),
          new TabData(funcionario.id, { id: funcionario.id }),
          null
        ));
      })
  }

  abrirProveedor(persona: Persona) {
    if (!persona?.isProveedor) {
      this.abrirDialogoProveedor({ persona });
      return;
    }
    this.proveedorService.onGetPorPersona(persona.id)
      .pipe(untilDestroyed(this))
      .subscribe(proveedor => {
        if (proveedor != null) this.abrirDialogoProveedor({ proveedor, isEditing: true });
      })
  }

  private abrirDialogoProveedor(data: EditProveedorData) {
    this.matDialog.open(EditProveedorComponent, {
      width: '600px',
      data
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((res: EditProveedorResult) => {
      if (res?.saved) this.onFiltrar();
    })
  }
}
