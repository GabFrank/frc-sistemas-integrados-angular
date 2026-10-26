import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../notificacion-snackbar.service';
import { ConfiguracionIa } from './configuracion-ia.model';
import { InteligenciaArtificialService } from './inteligencia-artificial.service';

const MODELO_POR_DEFECTO = 'gpt-4o';

@Component({
  selector: 'app-inteligencia-artificial',
  templateUrl: './inteligencia-artificial.component.html',
  styleUrls: ['./inteligencia-artificial.component.scss'],
})
export class InteligenciaArtificialComponent implements OnInit {
  configuracion: ConfiguracionIa | null = null;
  resultadoPrueba: string | null = null;
  ocupado = false;

  form = new FormGroup({
    apiKey: new FormControl<string>(''),
    modelo: new FormControl<string>(MODELO_POR_DEFECTO),
    promptAdicional: new FormControl<string>(''),
  });

  constructor(
    private service: InteligenciaArtificialService,
    private dialogos: DialogosService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  get cifradoDisponible(): boolean {
    return this.configuracion?.cifradoDisponible !== false;
  }

  cargar(): void {
    this.service.obtener().subscribe({
      next: (c) => c && this.aplicar(c),
    });
  }

  guardar(): void {
    const apiKey = (this.form.value.apiKey ?? '').trim();
    this.enviar(apiKey === '' ? null : apiKey, 'Configuración guardada.');
  }

  borrarClave(): void {
    this.dialogos
      .confirmar({
        titulo: 'Borrar clave',
        mensaje: '¿Borrar la clave de OpenAI guardada?',
        detalle: 'La lectura de facturas en papel dejará de funcionar hasta cargar una clave nueva.',
        si: 'Borrar',
        no: 'Cancelar',
        peligro: true,
      })
      .subscribe((ok) => {
        if (ok === true) {
          this.enviar('', 'Clave borrada.');
        }
      });
  }

  probarConexion(): void {
    this.ocupado = true;
    this.resultadoPrueba = null;
    this.service.probarConexion().subscribe({
      next: (texto) => {
        this.ocupado = false;
        if (texto != null) {
          this.resultadoPrueba = texto;
        }
      },
      error: () => (this.ocupado = false),
      complete: () => (this.ocupado = false),
    });
  }

  private enviar(apiKey: string | null, mensajeOk: string): void {
    this.ocupado = true;
    this.service
      .guardar(apiKey, (this.form.value.modelo ?? '').trim() || MODELO_POR_DEFECTO, this.form.value.promptAdicional ?? '')
      .subscribe({
        next: (c) => {
          this.ocupado = false;
          if (c) {
            this.aplicar(c);
            this.notificacion.notification$.next({
              texto: mensajeOk,
              color: NotificacionColor.success,
              duracion: 3,
            });
          }
        },
        error: () => (this.ocupado = false),
        complete: () => (this.ocupado = false),
      });
  }

  private aplicar(c: ConfiguracionIa): void {
    this.configuracion = c;
    this.form.patchValue({
      apiKey: '',
      modelo: c.modelo || MODELO_POR_DEFECTO,
      promptAdicional: c.promptAdicional ?? '',
    });
  }
}
