import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

// Diálogo de detalle para las cards de métricas del legajo-dashboard.
// Los módulos que alimentan estas métricas todavía no existen (ver TODO-5/6/7 del
// plan de testeo RRHH), por eso muestra DATOS DE EJEMPLO con un aviso claro.
@Component({
  selector: 'app-legajo-metrica-dialog',
  templateUrl: './legajo-metrica-dialog.component.html',
  styleUrls: ['./legajo-metrica-dialog.component.scss']
})
export class LegajoMetricaDialogComponent {

  tipo: 'puntuacion' | 'asistencia' | 'metas';
  nombre: string;

  titulo = '';
  // filas de ejemplo: { label, valor, progreso? (0..100) }
  filas: { label: string; valor: string; progreso?: number }[] = [];
  resumen = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.tipo = data?.tipo;
    this.nombre = data?.nombre || '';
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
        this.titulo = 'Puntuación de asistencia';
        this.resumen = 'Métricas derivadas de la marcación de horario del período.';
        this.filas = [
          { label: 'Días trabajados', valor: '22 / 24' },
          { label: 'Llegadas tardías', valor: '2' },
          { label: 'Ausencias justificadas', valor: '1' },
          { label: 'Ausencias injustificadas', valor: '0' },
          { label: 'Puntualidad', valor: '91%', progreso: 91 },
        ];
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
}
