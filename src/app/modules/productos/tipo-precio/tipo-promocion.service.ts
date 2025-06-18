import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TipoPrecioService } from './tipo-precio.service';
import { TipoPrecioInput } from './tipo-precio-input.model';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';

@Injectable({
  providedIn: 'root'
})
export class TiposPromocionService {

  constructor(
    private tipoPrecioService: TipoPrecioService,
    private notificacionService: NotificacionSnackbarService
  ) { }

  /**
   * Crea los nuevos tipos de precio para promociones si no existen
   * @param servidor - Si debe crear en servidor (true) o solo local (false)
   * @returns Observable con el resultado de la operación
   */
  crearTiposPromocion(servidor = true): Observable<any> {
    const tipoDescuento = new TipoPrecioInput();
    tipoDescuento.descripcion = 'PROMOCION_DESCUENTO';
    tipoDescuento.autorizacion = false;
    tipoDescuento.activo = true;

    const tipoCombo = new TipoPrecioInput();
    tipoCombo.descripcion = 'PROMOCION_COMBO';
    tipoCombo.autorizacion = false;
    tipoCombo.activo = true;

    const createDescuento$ = this.tipoPrecioService.onSave(tipoDescuento, servidor);
    const createCombo$ = this.tipoPrecioService.onSave(tipoCombo, servidor);

    return forkJoin([createDescuento$, createCombo$]).pipe(
      map(results => {
        this.notificacionService.openSucess(
          'Tipos de precio para promociones creados exitosamente',
          5
        );
        return {
          success: true,
          tipoDescuento: results[0],
          tipoCombo: results[1]
        };
      }),
      catchError(error => {
        this.notificacionService.openAlgoSalioMal(
          'Error al crear tipos de precio para promociones: ' + error.message,
          5
        );
        throw error;
      })
    );
  }

  /**
   * Verifica si los tipos de promoción ya existen
   * @param tiposExistentes - Lista de tipos de precio existentes
   * @returns boolean indicating if promotion types exist
   */
  verificarTiposPromocionExisten(tiposExistentes: any[]): boolean {
    const hasDescuento = tiposExistentes.some(tipo => 
      tipo.descripcion === 'PROMOCION_DESCUENTO'
    );
    const hasCombo = tiposExistentes.some(tipo => 
      tipo.descripcion === 'PROMOCION_COMBO'
    );
    
    return hasDescuento && hasCombo;
  }

  /**
   * Obtiene los tipos de promoción existentes
   * @param tiposExistentes - Lista de tipos de precio existentes
   * @returns Objeto con los tipos de promoción encontrados
   */
  obtenerTiposPromocion(tiposExistentes: any[]): { descuento?: any, combo?: any } {
    const tipoDescuento = tiposExistentes.find(tipo => 
      tipo.descripcion === 'PROMOCION_DESCUENTO'
    );
    const tipoCombo = tiposExistentes.find(tipo => 
      tipo.descripcion === 'PROMOCION_COMBO'
    );
    
    return {
      descuento: tipoDescuento,
      combo: tipoCombo
    };
  }

  /**
   * Verifica si un tipo de precio es de promoción
   * @param tipoPrecio - El tipo de precio a verificar
   * @returns boolean indicating if it's a promotion type
   */
  esPromocion(tipoPrecio: any): boolean {
    if (!tipoPrecio?.descripcion) return false;
    
    return tipoPrecio.descripcion === 'PROMOCION_DESCUENTO' || 
           tipoPrecio.descripcion === 'PROMOCION_COMBO';
  }

  /**
   * Obtiene el tipo de promoción basado en la descripción
   * @param descripcion - Descripción del tipo de precio
   * @returns Tipo de promoción ('DESCUENTO' | 'COMBO' | null)
   */
  getTipoPromocion(descripcion: string): 'DESCUENTO' | 'COMBO' | null {
    switch (descripcion) {
      case 'PROMOCION_DESCUENTO':
        return 'DESCUENTO';
      case 'PROMOCION_COMBO':
        return 'COMBO';
      default:
        return null;
    }
  }
} 