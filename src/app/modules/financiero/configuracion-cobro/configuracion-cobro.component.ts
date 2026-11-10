import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { ConfiguracionCobroService } from './configuracion-cobro.service';
import {
  ConfiguracionCobro, ConfiguracionCobroInput, TOPE_AUMENTO_DEFAULT, TOPE_DESCUENTO_DEFAULT,
} from './configuracion-cobro.model';

type Estado = 'cargando' | 'error' | 'datos';

/**
 * Cobro en PDV: el tope del aumento y el del descuento, en una pestaña. Se lee y se guarda en el
 * central; el cobro de cada caja lee la copia replicada en su filial.
 */
@UntilDestroy()
@Component({
  selector: 'app-configuracion-cobro',
  templateUrl: './configuracion-cobro.component.html',
  styleUrls: ['./configuracion-cobro.component.scss']
})
export class ConfiguracionCobroComponent implements OnInit {

  aumentoConTopeControl = new FormControl<boolean>(true);
  aumentoPorcentajeControl = new FormControl<number>(TOPE_AUMENTO_DEFAULT);
  descuentoConTopeControl = new FormControl<boolean>(false);
  descuentoPorcentajeControl = new FormControl<number>(TOPE_DESCUENTO_DEFAULT);
  modificadoPor: string = null;
  modificadoEn: Date = null;
  estado: Estado = 'cargando';
  guardando = false;

  constructor(
    private configuracionService: ConfiguracionCobroService,
    private notificacionService: NotificacionSnackbarService,
  ) { }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.estado = 'cargando';
    this.configuracionService.onGetConfiguracion().pipe(untilDestroyed(this)).subscribe({
      next: (res) => this.aplicar(res),
      error: () => (this.estado = 'error'),
    });
  }

  private aplicar(config: ConfiguracionCobro): void {
    this.aumentoConTopeControl.setValue(config?.aumentoConTope !== false);
    this.aumentoPorcentajeControl.setValue(config?.aumentoTopePorcentaje > 0 ? config.aumentoTopePorcentaje : TOPE_AUMENTO_DEFAULT);
    this.descuentoConTopeControl.setValue(config?.descuentoConTope === true);
    this.descuentoPorcentajeControl.setValue(config?.descuentoTopePorcentaje > 0 ? config.descuentoTopePorcentaje : TOPE_DESCUENTO_DEFAULT);
    this.modificadoPor = config?.id != null ? config?.usuarioNickname ?? null : null;
    this.modificadoEn = config?.id != null ? config?.modificadoEn ?? null : null;
    this.aumentoPorcentajeControl.markAsPristine();
    this.descuentoPorcentajeControl.markAsPristine();
    this.estado = 'datos';
  }

  onGuardar(): void {
    if (this.estado !== 'datos' || this.guardando) return;
    const aumentoConTope = this.aumentoConTopeControl.value === true;
    const aumentoPct = Number(this.aumentoPorcentajeControl.value);
    const descuentoConTope = this.descuentoConTopeControl.value === true;
    const descuentoPct = Number(this.descuentoPorcentajeControl.value);
    if (aumentoConTope && !(aumentoPct > 0 && aumentoPct <= 100)) {
      this.notificacionService.openWarn('El tope del aumento es un porcentaje del total: tiene que ser mayor a 0 y hasta 100.');
      return;
    }
    if (descuentoConTope && !(descuentoPct > 0 && descuentoPct <= 100)) {
      this.notificacionService.openWarn('El tope del descuento es un porcentaje del total: tiene que ser mayor a 0 y hasta 100.');
      return;
    }
    const input = new ConfiguracionCobroInput();
    input.aumentoConTope = aumentoConTope;
    input.descuentoConTope = descuentoConTope;
    // Sin tope no se manda el porcentaje: se conserva el guardado para cuando se vuelva a activar.
    if (aumentoConTope) input.aumentoTopePorcentaje = aumentoPct;
    if (descuentoConTope) input.descuentoTopePorcentaje = descuentoPct;
    this.guardando = true;
    this.configuracionService.onSaveConfiguracion(input).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.guardando = false;
        if (res != null) {
          this.notificacionService.openSucess('Configuración de cobro guardada');
          this.aplicar(res);
        }
      },
      error: () => (this.guardando = false),
    });
  }
}
