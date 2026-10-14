import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LegajoService } from '../legajo.service';
import { AsistenciaResumen } from '../legajo.model';
import {
  PeriodoAsistencia, esPeriodoActual, motivoSinAsistencia, moverPeriodo, periodoActual, textoPeriodo, textoPuntaje
} from '../asistencia.util';

// Diálogo de detalle para las cards de métricas del legajo-dashboard.
// 'asistencia' muestra datos reales del central (mes en curso, con selector de mes).
// 'puntuacion' y 'metas' siguen con DATOS DE EJEMPLO y un aviso claro: los módulos que
// los alimentan todavía no existen (ver TODO-5/7 del plan de testeo RRHH).
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-legajo-metrica-dialog',
  templateUrl: './legajo-metrica-dialog.component.html',
  styleUrls: ['./legajo-metrica-dialog.component.scss']
})
export class LegajoMetricaDialogComponent {

  tipo: 'puntuacion' | 'asistencia' | 'metas';
  nombre: string;
  funcionarioId: number;

  titulo = '';
  // { label, valor, progreso? (0..100) }
  filas: { label: string; valor: string; progreso?: number }[] = [];
  resumen = '';

  // Solo para 'asistencia'
  esAsistencia = false;
  periodo: PeriodoAsistencia = periodoActual();
  periodoTexto = '';
  esMesActual = true;
  cargando = false;
  /** Por qué no hay filas que mostrar (sin horario, mes sin días evaluados, lectura fallida). */
  mensaje: string = null;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private legajoService: LegajoService) {
    this.tipo = data?.tipo;
    this.nombre = data?.nombre || '';
    this.funcionarioId = data?.funcionarioId;
    this.build();
  }

  private build() {
    switch (this.tipo) {
      case 'puntuacion':
        this.titulo = 'Puntuación del funcionario';
        this.resumen = 'Promedio de evaluación 360° (compañeros + superior).';
        this.filas = [
          { label: 'Puntualidad', valor: '8.0 / 10' },
          { label: 'Trabajo en equipo', valor: '7.5 / 10' },
          { label: 'Proactividad', valor: '9.0 / 10' },
          { label: 'Atención al cliente', valor: '8.0 / 10' },
          { label: 'Cumplimiento de tareas', valor: '7.0 / 10' },
        ];
        break;
      case 'asistencia':
        this.esAsistencia = true;
        this.titulo = 'Puntuación de asistencia';
        this.resumen = 'Métricas derivadas de la marcación de horario del mes.';
        this.cargarAsistencia();
        break;
      case 'metas':
        this.titulo = 'Metas y objetivos del mes';
        this.resumen = 'Objetivos asignados y su progreso (futuro módulo de comisiones).';
        this.filas = [
          { label: 'Meta de ventas', valor: '70%', progreso: 70 },
          { label: 'Clientes nuevos', valor: '3 / 5', progreso: 60 },
          { label: 'Cobranzas', valor: '100%', progreso: 100 },
          { label: 'Capacitación', valor: '0 / 1', progreso: 0 },
        ];
        break;
    }
  }

  onMoverMes(delta: number) {
    if (delta > 0 && this.esMesActual) { return; }
    this.periodo = moverPeriodo(this.periodo, delta);
    this.cargarAsistencia();
  }

  private cargarAsistencia() {
    this.periodoTexto = textoPeriodo(this.periodo);
    this.esMesActual = esPeriodoActual(this.periodo);
    if (this.funcionarioId == null) { return; }
    this.cargando = true;
    this.legajoService.onGetAsistencia(this.funcionarioId, this.periodo.anho, this.periodo.mes)
      .pipe(untilDestroyed(this)).subscribe({
        next: (r: AsistenciaResumen) => { this.cargando = false; this.setAsistencia(r); },
        error: () => { this.cargando = false; this.setAsistencia(null); },
      });
  }

  private setAsistencia(r: AsistenciaResumen) {
    this.mensaje = motivoSinAsistencia(r);
    if (this.mensaje != null) { this.filas = []; return; }
    this.filas = [
      { label: 'Puntaje', valor: textoPuntaje(r) },
      { label: 'Días trabajados', valor: `${r.diasTrabajados} / ${r.diasEsperados}` },
      { label: 'Llegadas tardías', valor: `${r.llegadasTardias}` },
      { label: 'Ausencias justificadas', valor: `${r.ausenciasJustificadas}` },
      { label: 'Ausencias injustificadas', valor: `${r.ausenciasInjustificadas}` },
      r.puntualidad != null
        ? { label: 'Puntualidad', valor: `${r.puntualidad}%`, progreso: r.puntualidad }
        : { label: 'Puntualidad', valor: '—' },
    ];
  }
}
