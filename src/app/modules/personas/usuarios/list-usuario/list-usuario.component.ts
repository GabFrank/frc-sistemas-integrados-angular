import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { MainService } from '../../../../main.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Role } from '../../../configuracion/roles/role.model';
import { RoleService } from '../../../configuracion/roles/role.service';
import { ROLES } from '../../roles/roles.enum';
import { AdicionarUsuarioDialogComponent } from '../adicionar-usuario-dialog/adicionar-usuario-dialog.component';
import { Usuario } from '../usuario.model';
import { UsuarioService } from '../usuario.service';

@UntilDestroy()
@Component({
  selector: 'app-list-usuario',
  templateUrl: './list-usuario.component.html',
  styleUrls: ['./list-usuario.component.scss'],
})
export class ListUsuarioComponent implements OnInit {

  readonly ROLES = ROLES
  puedeEditarUsuarios = false;

  @ViewChild('buscar', { static: true }) buscar: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<Usuario>([]);
  selectedUsuario: Usuario;
  displayedColumns: string[] = ['id', 'nombre', 'nickname', 'telefono', 'activo', 'creadoEn', 'acciones'];

  pageSize = 25;
  cargando = false;
  pageIndex = 0;
  selectedPageInfo: PageInfo<Usuario>;
  timer: ReturnType<typeof setTimeout>;

  buscarControl = new FormControl(null);

  // Arranca deshabilitado: se habilita cuando llegan los roles. Si la carga falla,
  // onGetAll emite null y el selector queda deshabilitado en vez de vacio.
  rolesControl = new FormControl<number[]>({ value: [], disabled: true });
  roleList: Role[] = [];
  rolesResumen = '';
  private rolesFiltrados = '';

  constructor(
    public service: UsuarioService,
    private matDialog: MatDialog,
    public mainService: MainService,
    private dialogoService: DialogosService,
    private roleService: RoleService
  ) { }

  ngOnInit(): void {
    this.puedeEditarUsuarios = this.mainService.tieneAlgunRol([ROLES.EDITAR_USUARIOS]);
    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[1]);
      this.pageSize = this.paginator.pageSizeOptions[1];
      this.cargarPagina();
      this.cargarRoles();
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

  cargarRoles(): void {
    this.roleService.onGetRoles()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res?.length > 0) {
          this.roleList = [...res].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
          this.rolesControl.enable();
        }
      });
  }

  // Filtra al cerrar el selector, no en cada tilde (regla del repo sobre valueChanges).
  onRolesOpenedChange(abierto: boolean): void {
    if (abierto) return;
    this.actualizarRolesResumen();
    const seleccion = this.rolesSeleccionadosKey();
    if (seleccion !== this.rolesFiltrados) {
      this.onFiltrar();
    }
  }

  private rolesSeleccionadosKey(): string {
    return [...(this.rolesControl.value || [])].map(String).sort().join(',');
  }

  private actualizarRolesResumen(): void {
    const ids = (this.rolesControl.value || []).map(String);
    const nombres = this.roleList.filter(r => ids.includes(String(r.id))).map(r => r.nombre);
    this.rolesResumen = nombres.length > 1
      ? `${nombres[0]} (+${nombres.length - 1} ${nombres.length === 2 ? 'otro' : 'otros'})`
      : (nombres[0] || '');
  }

  // Filtrar, Buscar y Enter vuelven a la página 1 (variable y paginador).
  onFiltrar(): void {
    clearTimeout(this.timer);
    this.pageIndex = 0;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.cargarPagina();
  }

  cargarPagina(): void {
    const texto = this.buscarControl.value?.toString().trim() || null;
    const roleIds = this.rolesControl.value || [];
    this.rolesFiltrados = this.rolesSeleccionadosKey();
    this.cargando = true;
    this.service.onSearchConFiltros(texto, this.pageIndex, this.pageSize, true, roleIds)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.cargando = false;
          if (res != null) {
            this.selectedPageInfo = res;
            this.dataSource.data = this.selectedPageInfo?.getContent || [];
          }
        },
        error: () => (this.cargando = false),
      });
  }

  resetFiltro(): void {
    this.pageIndex = 0;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.dataSource.data = [];
    this.selectedPageInfo = null;
    this.rolesControl.setValue([]);
    this.rolesResumen = '';
    // No llamar onFiltrar aca: el valueChanges de buscarControl ya busca (con los roles vacios).
    this.buscarControl.setValue(null);
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargarPagina();
  }

  onAddUsuario(usuario?: Usuario, index?) {
    this.matDialog.open(AdicionarUsuarioDialogComponent, {
      data: {
        usuario
      },
      width: '720px',
      maxWidth: '90vw'
    })
  }

  onNuevoUsuario() {
    this.matDialog.open(AdicionarUsuarioDialogComponent, {
      data: {},
      width: '720px',
      maxWidth: '90vw'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
      // Siempre: cerrar con Esc después del alta no devuelve el usuario creado.
      this.cargarPagina();
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
