import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy
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
import { Persona } from '../../../../personas/persona/persona.model';
import { BuscarPersonaDialogComponent } from '../../../../personas/persona/buscar-persona-dialog/buscar-persona-dialog.component';

@UntilDestroy()
@Component({
  selector: 'list-marcacion',
  templateUrl: './list-marcacion.component.html',
  styleUrls: ['./list-marcacion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListMarcacionComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<Marcacion>([]);

  idControl = new FormControl();
  personaControl = new FormControl();
  fechaInicioControl = new FormControl();
  fechaFinControl = new FormControl();
  fechaFormGroup: FormGroup;

  personaSeleccionada: Persona = null;
  sucursalActualNombre = '';
  hoy = new Date();

  displayedColumns = [
    'id',
    'usuario',
    'sucursalEntrada',
    'fechaEntrada',
    'sucursalSalida',
    'fechaSalida',
    'presencial',
    'acciones'
  ];

  constructor(
    public mainService: MainService,
    private marcacionService: MarcacionService,
    private matDialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.sucursalActualNombre = this.mainService.sucursalActual?.nombre || 'Sin sucursal';

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinControl
    });

    this.inicializarFechas();
    this.filtrar();
  }

  inicializarFechas(): void {
    const unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(this.hoy.getDate() - 7);
    this.fechaInicioControl.setValue(unaSemanaAtras);
    this.fechaFinControl.setValue(this.hoy);
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

    if (this.idControl.value != null) {
      this.marcacionService.onGetMarcacion(this.idControl.value)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.dataSource.data = res ? [res] : [];
        });
      return;
    }

    if (this.personaSeleccionada?.usuario?.id) {
      const fechaInicio = dateToString(this.fechaInicioControl.value);
      const fechaFin = dateToString(this.fechaFinControl.value);

      this.marcacionService.onGetMarcacionesPorUsuario(
        this.personaSeleccionada.usuario.id,
        fechaInicio,
        fechaFin
      ).pipe(untilDestroyed(this))
        .subscribe(res => {
          this.dataSource.data = res || [];
        });
    } else {
      this.marcacionService.onGetMarcaciones(0, 50)
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          this.dataSource.data = res || [];
        });
    }
  }

  resetearFiltro(): void {
    this.idControl.setValue(null);
    this.personaControl.setValue(null);
    this.personaSeleccionada = null;
    this.inicializarFechas();
    this.filtrar();
  }

  abrirBuscadorPersona(): void {
    const dialogRef = this.matDialog.open(BuscarPersonaDialogComponent, {
      width: '80%',
      height: '80%',
      data: {}
    });

    dialogRef.afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((persona: Persona) => {
        if (persona) {
          this.personaSeleccionada = persona;
          this.personaControl.setValue(persona.nombre);
          this.filtrar();
        }
      });
  }

  limpiarPersona(): void {
    this.personaSeleccionada = null;
    this.personaControl.setValue(null);
    this.filtrar();
  }

  eliminar(marcacion: Marcacion, index: number): void {
    this.marcacionService.onDeleteMarcacion(marcacion.id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          const data = [...this.dataSource.data];
          data.splice(index, 1);
          this.dataSource.data = data;
        }
      });
  }
}
