import { Component } from '@angular/core';
import { TiposPromocionService } from './tipo-promocion.service';
import { TipoPrecioService } from './tipo-precio.service';
import { CargandoDialogService } from '../../../shared/components/cargando-dialog/cargando-dialog.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-tipos-promocion',
  templateUrl: './tipo-promocion.component.html',
  styleUrls: ['./tipo-promocion.component.scss']
})
export class TiposPromocionComponent {
  procesando = false;
  resultado: { success: boolean, mensaje: string } | null = null;

  constructor(
    private tiposPromocionService: TiposPromocionService,
    private tipoPrecioService: TipoPrecioService,
    private cargandoService: CargandoDialogService
  ) {}

  inicializarTipos() {
    this.procesando = true;
    this.resultado = null;
    this.cargandoService.openDialog();

    // Primero verificar si ya existen los tipos
    this.tipoPrecioService.onGetAllTipoPrecios(true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          const tiposExistentes = response?.data || [];
          
          if (this.tiposPromocionService.verificarTiposPromocionExisten(tiposExistentes)) {
            this.resultado = {
              success: true,
              mensaje: 'Los tipos de promoción ya existen en el sistema.'
            };
            this.procesando = false;
            this.cargandoService.closeDialog();
            return;
          }

          // Si no existen, crearlos
          this.tiposPromocionService.crearTiposPromocion(true)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (result) => {
                this.resultado = {
                  success: true,
                  mensaje: 'Tipos de promoción creados exitosamente.'
                };
                this.procesando = false;
                this.cargandoService.closeDialog();
              },
              error: (error) => {
                this.resultado = {
                  success: false,
                  mensaje: `Error al crear tipos de promoción: ${error.message || 'Error desconocido'}`
                };
                this.procesando = false;
                this.cargandoService.closeDialog();
              }
            });
        },
        error: (error) => {
          this.resultado = {
            success: false,
            mensaje: `Error al verificar tipos existentes: ${error.message || 'Error desconocido'}`
          };
          this.procesando = false;
          this.cargandoService.closeDialog();
        }
      });
  }
} 