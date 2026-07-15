import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { MainService } from '../../../../main.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { ROLES } from '../../roles/roles.enum';
import { AdicionarUsuarioDialogComponent } from '../adicionar-usuario-dialog/adicionar-usuario-dialog.component';
import { Usuario } from '../usuario.model';
import { UsuarioService } from '../usuario.service';

@UntilDestroy()
@Component({
  selector: 'app-list-usuario',
  templateUrl: './list-usuario.component.html',
  styleUrls: ['./list-usuario.component.css'],
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
export class ListUsuarioComponent implements OnInit {

  readonly ROLES = ROLES

  @ViewChild('buscar', { static: true }) buscar: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<Usuario>([]);
  selectedUsuario: Usuario;
  displayedColumns: string[] = ['id', 'nombre', 'nickname', 'telefono', 'activo', 'creadoEn', 'acciones'];
  expandedUsuario: Usuario;

  pageSize = 25;
  pageIndex = 0;
  selectedPageInfo: PageInfo<Usuario>;
  timer: ReturnType<typeof setTimeout>;

  buscarControl = new FormControl(null);

  constructor(
    public service: UsuarioService,
    private matDialog: MatDialog,
    public mainService: MainService,
    private dialogoService: DialogosService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[1]);
      this.pageSize = this.paginator.pageSizeOptions[1];
      this.onFiltrar();
    }, 0);

    this.buscarControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((valor) => {
        this.pageIndex = 0;
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

  onFiltrar(): void {
    const texto = this.buscarControl.value?.toString().trim() || null;
    this.service.onSearchConFiltros(texto, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.selectedPageInfo = res;
          this.dataSource.data = this.selectedPageInfo?.getContent || [];
        }
      });
  }

  resetFiltro(): void {
    this.pageIndex = 0;
    this.dataSource.data = [];
    this.selectedPageInfo = null;
    this.buscarControl.setValue(null);
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  onAddUsuario(usuario?: Usuario, index?) {
    this.matDialog.open(AdicionarUsuarioDialogComponent, {
      data: {
        usuario
      },
      width: '60%',
      height: '80%'
    })
  }

  onEditRoles(usuario, i) {

  }

  onInitPassword(usuario: Usuario, i) {
    this.dialogoService.confirm('Atención!! Estas reseteando una contraseña', 'Esta acción no se puede deshacer.').subscribe(dialogRes => {
      if (dialogRes) {
        let aux = new Usuario;
        Object.assign(aux, usuario);
        aux.password = '123';
        this.service.onSaveUsuario(aux.toInput()).subscribe(res => {

        })
      }
    })

  }

}
