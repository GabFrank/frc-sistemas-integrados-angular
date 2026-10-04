import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface PantallaMenu {
  titulo: string;
  // Grupos del menu que contienen la pantalla, ej. "Financiero > Caja y Operativa"
  ruta: string;
  action: string;
}

/**
 * Puente entre el menu lateral y el buscador global (#235).
 *
 * El menu es la unica fuente de verdad de las pantallas: publica aca las entradas que el usuario
 * ve y atiende los pedidos de apertura con su propio onItemClick. Asi el buscador no mantiene un
 * catalogo paralelo ni duplica el control de roles.
 */
@Injectable({
  providedIn: 'root'
})
export class NavegacionMenuService {

  private proveedor: () => PantallaMenu[] = () => [];
  private abrirSub = new Subject<string>();

  abrir$: Observable<string> = this.abrirSub.asObservable();

  registrarMenu(proveedor: () => PantallaMenu[]): void {
    this.proveedor = proveedor;
  }

  pantallasVisibles(): PantallaMenu[] {
    return this.proveedor();
  }

  abrir(action: string): void {
    this.abrirSub.next(action);
  }
}
