import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Tema = 'oscuro' | 'claro';

const CLAVE = 'frc-tema';
const CLASE: Record<Tema, string> = { oscuro: 'darkMode', claro: 'lightMode' };

/**
 * Modo oscuro o claro de la app. Pone la clase del tema en <html>: así la toman la app, los diálogos y los
 * menús (el contenedor de overlays cuelga del body). La preferencia queda en esta PC (localStorage).
 * Los colores salen de los tokens --frc-* de styles.scss.
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly temaSubject = new BehaviorSubject<Tema>(this.leerGuardado());
  readonly tema$ = this.temaSubject.asObservable();

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.aplicar(this.temaSubject.value);
  }

  get tema(): Tema {
    return this.temaSubject.value;
  }

  alternar(): void {
    this.cambiar(this.tema === 'oscuro' ? 'claro' : 'oscuro');
  }

  cambiar(tema: Tema): void {
    this.aplicar(tema);
    this.temaSubject.next(tema);
    try {
      localStorage.setItem(CLAVE, tema);
    } catch {
      // Sin almacenamiento el tema vale solo para esta sesión.
    }
  }

  private aplicar(tema: Tema): void {
    const raiz = this.document.documentElement.classList;
    raiz.remove(CLASE.oscuro, CLASE.claro);
    raiz.add(CLASE[tema]);
  }

  private leerGuardado(): Tema {
    try {
      return localStorage.getItem(CLAVE) === 'claro' ? 'claro' : 'oscuro';
    } catch {
      return 'oscuro';
    }
  }
}
