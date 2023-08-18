import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { WindowInfoService } from '../../../../shared/services/window-info.service';
import { ROLES } from '../../roles/roles.enum';
import { AdicionarUsuarioDialogComponent } from '../adicionar-usuario-dialog/adicionar-usuario-dialog.component';
import { Usuario } from '../usuario.model';
import { UsuarioService } from '../usuario.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';

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

  dataSource = new MatTableDataSource<Usuario>([]);
  selectedUsuario: Usuario;
  displayedColumns: string[] = ['id', 'nombre', 'nickname', 'telefono', 'activo', 'creadoEn', 'acciones'];
  expandedUsuario: Usuario;

  page = -1;
  isLastPage = false;
  isSearching = false;

  buscarControl = new FormControl(null, Validators.required)

  constructor(
    public service: UsuarioService,
    private matDialog: MatDialog,
    public mainService: MainService,
    private dialogoService: DialogosService
  ) { }

  ngOnInit(): void {
    this.cargarMasDatos()
  }

  rowSelectedEvent(e) {
  }

  onFiltrar() {
    if (this.buscarControl.valid) {
      this.isSearching = true;
      this.service.onSeachUsuario(this.buscarControl.value)
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

  cargarMasDatos() {
    this.isSearching = true;
    this.page++;
    this.service.onGetUsuarios(this.page)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res.length == 0) this.isLastPage = true;
        this.isSearching = false;
        this.dataSource.data = this.dataSource.data.concat(res)
      })
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
