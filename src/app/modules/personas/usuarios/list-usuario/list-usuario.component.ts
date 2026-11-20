import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { MainService } from '../../../../main.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Role } from '../../../configuracion/roles/role.model';
import { RoleService } from '../../../configuracion/roles/role.service';
import { ROLES } from '../../roles/roles.enum';
import { AdicionarUsuarioDialogComponent } from '../adicionar-usuario-dialog/adicionar-usuario-dialog.component';
import { Usuario } from '../usuario.model';
import { UsuarioService } from '../usuario.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-usuario',
  templateUrl: './list-usuario.component.html',
  styleUrls: ['./list-usuario.component.scss'],
})
export class ListUsuarioComponent implements OnInit {

  readonly ROLES = ROLES
  puedeEditarUsuarios = false;

  @ViewChild('buscar', { static: true }) buscar: ElementRef;

  selectedUsuario: Usuario;
  displayedColumns: string[] = ['id', 'nombre', 'nickname', 'telefono', 'activo', 'creadoEn', 'acciones'];

  /** Usuarios paginados en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag = new PaginacionLista<Usuario>({
    cargar: (page, size) => {
      this.rolesFiltrados = this.rolesSeleccionadosKey();
      return this.service.onSearchConFiltros(this.buscarControl.value?.toString().trim() || null, page, size, true,
        this.rolesControl.value || [], this.estadoControl.value);
    },
    pageSize: 25,
  });
  timer: ReturnType<typeof setTimeout>;

  buscarControl = new FormControl(null);

  // Arranca deshabilitado: se habilita cuando llegan los roles. Si la carga falla,
  // onGetAll emite null y el selector queda deshabilitado en vez de vacio.
  rolesControl = new FormControl<number[]>({ value: [], disabled: true });
  roleList: Role[] = [];

  // null = todos, true = activos, false = inactivos.
  estadoControl = new FormControl<boolean | null>(null);
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
    // UsuarioService y RoleService resuelven su GenericCrudService en un setTimeout: la primera consulta va después.
    setTimeout(() => {
      this.pag.filtrar();
      this.cargarRoles();
    }, 0);

    this.buscarControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((valor) => {
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

  // Filtrar, Buscar y Enter vuelven a la página 1.
  onFiltrar(): void {
    clearTimeout(this.timer);
    this.pag.filtrar();
  }

  /** Repite la página a la vista (después de crear o editar). */
  cargarPagina(): void {
    this.pag.recargar();
  }

  resetFiltro(): void {
    this.pag.limpiar();
    this.rolesControl.setValue([]);
    this.rolesResumen = '';
    this.estadoControl.setValue(null);
    // No llamar onFiltrar aca: el valueChanges de buscarControl ya busca (con los roles vacios).
    this.buscarControl.setValue(null);
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
