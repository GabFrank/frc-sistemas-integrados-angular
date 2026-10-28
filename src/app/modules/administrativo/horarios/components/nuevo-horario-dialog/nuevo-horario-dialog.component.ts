import { Component, Inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HorarioInput } from '../../models/horario.model';
import { HorarioService } from '../../service/horario.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { HORA_VALIDA, OPCIONES_HORA, normalizarHora, posicionarListaHora } from '../../utils/selector-hora';

export interface NuevoHorarioDialogData {
  funcionarioId: number;
  nombre: string;
}

/**
 * Crea un horario y se lo deja asignado al funcionario (#523). Se abre desde la tabla de
 * horarios desplegada en la lista de funcionarios. Cierra con el funcionario actualizado
 * (id + horarioResumen), o sin nada si se cancela.
 */
@UntilDestroy()
@Component({
  selector: 'app-nuevo-horario-dialog',
  templateUrl: './nuevo-horario-dialog.component.html',
  styleUrls: ['./nuevo-horario-dialog.component.scss'],
})
export class NuevoHorarioDialogComponent {
  readonly opcionesHora = OPCIONES_HORA;

  readonly diasSemana = [
    { value: 'TODOS', viewValue: 'Todos' },
    { value: 'LUNES', viewValue: 'Lunes' },
    { value: 'MARTES', viewValue: 'Martes' },
    { value: 'MIERCOLES', viewValue: 'Miércoles' },
    { value: 'JUEVES', viewValue: 'Jueves' },
    { value: 'VIERNES', viewValue: 'Viernes' },
    { value: 'SABADO', viewValue: 'Sábado' },
    { value: 'DOMINGO', viewValue: 'Domingo' },
  ];

  readonly listaTurnos = [
    { code: 'DIA', name: 'Día' },
    { code: 'NOCHE', name: 'Noche' },
    { code: 'MADRUGADA', name: 'Madrugada' },
  ];

  form = new FormGroup({
    entrada: new FormControl<string>(null, [Validators.required, Validators.pattern(HORA_VALIDA)]),
    salida: new FormControl<string>(null, [Validators.required, Validators.pattern(HORA_VALIDA)]),
    turno: new FormControl<string>(null, Validators.required),
    dias: new FormControl<string[]>(['TODOS'], Validators.required),
  });

  guardando = false;
  private diasAnteriores: string[] = ['TODOS'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: NuevoHorarioDialogData,
    private dialogRef: MatDialogRef<NuevoHorarioDialogComponent>,
    private horarioService: HorarioService,
    private notificacionService: NotificacionSnackbarService
  ) { }

  onListaHoraAbierta(lista: MatAutocomplete, control: AbstractControl): void {
    posicionarListaHora(lista, control.value);
  }

  onNormalizarHora(control: AbstractControl): void {
    const hora = normalizarHora(control.value);
    if (hora && hora !== control.value) control.setValue(hora);
  }

  /** "Todos" no se combina con días sueltos: elegir uno quita al otro. */
  onCambioDias(): void {
    const control = this.form.controls.dias;
    const dias: string[] = control.value || [];
    const eligioTodos = dias.includes('TODOS') && !this.diasAnteriores.includes('TODOS');
    let nuevos = dias;
    if (eligioTodos) nuevos = ['TODOS'];
    else if (dias.includes('TODOS') && dias.length > 1) nuevos = dias.filter(d => d !== 'TODOS');
    if (nuevos !== dias) control.setValue(nuevos);
    this.diasAnteriores = nuevos;
  }

  onGuardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificacionService.openWarn('Completá entrada, salida, turno y días');
      return;
    }
    const v = this.form.getRawValue();
    const input = new HorarioInput();
    input.horaEntrada = v.entrada;
    input.horaSalida = v.salida;
    input.turno = v.turno;
    input.dias = v.dias;
    this.guardando = true;
    this.horarioService.onAgregarHorarioFuncionario(this.data.funcionarioId, input)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.guardando = false;
          this.notificacionService.openSucess('Horario creado y asignado');
          this.dialogRef.close(res);
        },
        error: () => (this.guardando = false),
      });
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
