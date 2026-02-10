import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  AfterViewInit
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { MainService } from '../../../../../main.service';
import { dateToString } from '../../../../../commons/core/utils/dateUtils';
import { MarcacionService } from '../../service/marcacion.service';
import { Marcacion } from '../../models/marcacion.model';
import { Usuario } from '../../../../personas/usuarios/usuario.model';
import { UsuarioSearchGQL } from '../../../../personas/usuarios/graphql/usuarioSearch';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { UsuarioService } from '../../../../personas/usuarios/usuario.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { PersonaService } from '../../../../personas/persona/persona.service';

@UntilDestroy()
@Component({
  selector: 'list-marcacion',
  templateUrl: './list-marcacion.component.html',
  styleUrls: ['./list-marcacion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListMarcacionComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<Marcacion>([]);


  usuarioIdControl = new FormControl();
  usuarioNombreControl = new FormControl();
  fechaInicioControl = new FormControl();
  fechaFinControl = new FormControl();
  fechaFormGroup: FormGroup;

  usuarioSeleccionado: Usuario = null;
  hoy = new Date();

  displayedColumns = [
    'id',
    'usuario',
    'sucursalEntrada',
    'fechaEntrada',
    'sucursalSalida',
    'fechaSalida'
  ];

  constructor(
    public mainService: MainService,
    private marcacionService: MarcacionService,
    private matDialog: MatDialog,
    private personaService: PersonaService,
    private usuarioService: UsuarioService,
    private searchUsuario: UsuarioSearchGQL,
    private notificacionService: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef
  ) { }

  buscarUsuario(): void {
    const valor = this.usuarioIdControl.value;
    if (valor) {
      if (!isNaN(valor)) {
        this.usuarioService.onGetUsuarioPorPersonaId(valor)
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res) {
              this.seleccionarUsuario(res);
            } else {
              this.mensajeErrorPersona(valor);
            }
          });
      } else {
        this.abrirBuscadorUsuario();
      }
    } else {
      this.abrirBuscadorUsuario();
    }
  }

  mensajeErrorPersona(id: number): void {
    this.personaService.onGetPersona(id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.notificacionService.openWarn('La persona encontrada no tiene usuario asociado. Debe crear un usuario para esta persona.');
        } else {
          this.notificacionService.openWarn('No se encontró ninguna persona con ese ID');
        }
        this.usuarioIdControl.setErrors({ invalid: true });
      });
  }

  seleccionarUsuario(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
    this.usuarioNombreControl.setValue(usuario.persona?.nombre);
    this.usuarioIdControl.setValue(usuario.id);
    this.filtrar();
  }

  ngOnInit(): void {
    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinControl
    });

    this.inicializarFechas();
    this.filtrar();
  }

  inicializarFechas(): void {
    const ayer = new Date();
    ayer.setDate(this.hoy.getDate() - 1);
    ayer.setHours(0, 0, 0, 0);
    this.fechaInicioControl.setValue(ayer);
    this.fechaFinControl.setValue(this.hoy);
  }

  ngAfterViewInit(): void {
    this.paginator.page.pipe(untilDestroyed(this)).subscribe(() => {
      this.filtrar();
    });
  }

  filtrar(): void {
    if (this.fechaFinControl.value == null) {
      this.fechaFinControl.setValue(this.hoy);
    }

    if (this.fechaInicioControl.value == null) {
      const unaSemanaAtras = new Date();
      unaSemanaAtras.setDate(this.fechaFinControl.value.getDate() - 7);
      this.fechaInicioControl.setValue(unaSemanaAtras);
    }

    const page = this.paginator ? this.paginator.pageIndex : 0;
    const size = this.paginator ? this.paginator.pageSize : 15;

    if (this.usuarioSeleccionado?.id) {
      const fechaInicio = dateToString(this.fechaInicioControl.value);
      const fechaFin = dateToString(this.fechaFinControl.value);

      this.marcacionService.onGetMarcacionesPorUsuario(
        this.usuarioSeleccionado.id,
        fechaInicio,
        fechaFin,
        page,
        size
      ).pipe(untilDestroyed(this))
        .subscribe(res => {
          this.dataSource.data = res || [];
        });
    } else {
      this.marcacionService.onGetMarcaciones(page, size)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.dataSource.data = res || [];
        });
    }
  }

  resetearFiltro(): void {
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.usuarioIdControl.setValue(null);
    this.usuarioNombreControl.setValue(null);
    this.usuarioSeleccionado = null;
    this.inicializarFechas();
    this.filtrar();
  }

  abrirBuscadorUsuario(): void {
    let data: SearchListtDialogData = {
      titulo: "Buscar Persona",
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        {
          id: "nombre",
          nombre: "Nombre",
          nested: true,
          nestedId: "persona",
          width: "50%",
        },
        {
          id: "documento",
          nombre: "Documento",
          nested: true,
          nestedId: "persona",
          width: "40%",
        },
      ],
      query: this.searchUsuario,
    };

    this.matDialog
      .open(SearchListDialogComponent, {
        data: data,
        height: "80vh",
        width: "70vw",
        panelClass: 'search-dialog-dark'
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((usuario: Usuario) => {
        if (usuario) {
          this.seleccionarUsuario(usuario);
        }
      });
  }

  limpiarUsuario(): void {
    this.usuarioSeleccionado = null;
    this.usuarioNombreControl.setValue(null);
    this.usuarioIdControl.setValue(null);
    this.filtrar();
  }

  onGenerarPdf(): void {
    const fechaInicio = this.fechaInicioControl.value
      ? dateToString(this.fechaInicioControl.value)
      : null;
    const fechaFin = this.fechaFinControl.value
      ? dateToString(this.fechaFinControl.value)
      : null;
    const usuarioId = this.usuarioSeleccionado?.id || null;

    this.marcacionService.onImprimirReporteMarcaciones(usuarioId, fechaInicio, fechaFin);
  }
}
