import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import {
  BorradorVerificacion, ConteoRetiroMonedaInput, EstadoCasoRetiro,
  RetiroCaso, RetiroVerificacion, claveBorrador,
} from './retiro-verificacion.model';
import { VerificacionDeRetiroGQL } from './graphql/verificacionDeRetiro';
import { VerificarRetiroGQL } from './graphql/verificarRetiro';
import { AnularVerificacionRetiroGQL } from './graphql/anularVerificacionRetiro';
import { RetiroCasosGQL } from './graphql/retiroCasos';
import { AsignarRetiroCasoGQL } from './graphql/asignarRetiroCaso';
import { ResolverRetiroCasoGQL } from './graphql/resolverRetiroCaso';
import { SoltarRetiroCasoGQL } from './graphql/soltarRetiroCaso';

@Injectable({ providedIn: 'root' })
export class RetiroVerificacionService {

  constructor(
    private genericService: GenericCrudService,
    private verificacionDeRetiroGQL: VerificacionDeRetiroGQL,
    private verificarRetiroGQL: VerificarRetiroGQL,
    private anularVerificacionGQL: AnularVerificacionRetiroGQL,
    private retiroCasosGQL: RetiroCasosGQL,
    private asignarCasoGQL: AsignarRetiroCasoGQL,
    private resolverCasoGQL: ResolverRetiroCasoGQL,
    private soltarCasoGQL: SoltarRetiroCasoGQL,
  ) {}

  onGetVerificacion(retiroId: number, sucursalId: number): Observable<RetiroVerificacion> {
    return this.genericService.onCustomQuery(this.verificacionDeRetiroGQL, { retiroId, sucursalId });
  }

  onVerificar(retiroId: number, sucursalId: number, cajaVirtualId: number,
              conteos: ConteoRetiroMonedaInput[], rapida: boolean,
              observacion: string): Observable<RetiroVerificacion> {
    return this.genericService.onSaveCustom(this.verificarRetiroGQL, {
      retiroId, sucursalId, cajaVirtualId, conteos, rapida,
      observacion: observacion ? observacion.toUpperCase() : null,
    });
  }

  onAnular(verificacionId: number, motivo?: string): Observable<RetiroVerificacion> {
    return this.genericService.onSaveCustom(this.anularVerificacionGQL, { verificacionId, motivo });
  }

  onGetCasos(filtros: {
    estado?: EstadoCasoRetiro; sucursalId?: number; retiroId?: number;
    desde?: string; hasta?: string; soloMios?: boolean;
  }, page = 0, size = 20): Observable<PageInfo<RetiroCaso>> {
    return this.genericService.onCustomQuery(this.retiroCasosGQL, {
      estado: filtros?.estado || null,
      sucursalId: filtros?.sucursalId ?? null,
      retiroId: filtros?.retiroId ?? null,
      desde: filtros?.desde || null,
      hasta: filtros?.hasta || null,
      soloMios: filtros?.soloMios ? true : null,
      page, size,
    });
  }

  onAsignarCaso(casoId: number, usuarioId: number): Observable<RetiroCaso> {
    return this.genericService.onSaveCustom(this.asignarCasoGQL, { casoId, usuarioId });
  }

  /** Devuelve el caso a ABIERTO: se tomó por error o no corresponde. */
  onSoltarCaso(casoId: number): Observable<RetiroCaso> {
    return this.genericService.onSaveCustom(this.soltarCasoGQL, { casoId });
  }

  onResolverCaso(casoId: number, datos: {
    veredicto: string; resolucion: string;
    responsablePersonaId?: number; reintegroRetiroId?: number; anularVerificacion?: boolean;
  }): Observable<RetiroCaso> {
    return this.genericService.onSaveCustom(this.resolverCasoGQL, {
      casoId,
      veredicto: datos.veredicto,
      resolucion: datos.resolucion ? datos.resolucion.toUpperCase() : null,
      responsablePersonaId: datos.responsablePersonaId ?? null,
      reintegroRetiroId: datos.reintegroRetiroId ?? null,
      anularVerificacion: datos.anularVerificacion ? true : null,
    });
  }

  // ── Borrador local ───────────────────────────────────────────────────────────────────
  //
  // Contar plata se interrumpe todo el tiempo. El borrador deja retomar sin volver a contar.
  // Vive en el navegador: es de esta máquina, no del retiro. Si se cuenta desde otra PC no
  // está, y eso es aceptable — en el depósito hay una sola terminal de tesorería.

  leerBorrador(retiroId: number, sucursalId: number): BorradorVerificacion {
    try {
      const raw = localStorage.getItem(claveBorrador(retiroId, sucursalId));
      return raw ? JSON.parse(raw) as BorradorVerificacion : null;
    } catch {
      return null;
    }
  }

  guardarBorrador(retiroId: number, sucursalId: number, borrador: BorradorVerificacion) {
    try {
      localStorage.setItem(claveBorrador(retiroId, sucursalId), JSON.stringify(borrador));
    } catch {
      // Cuota llena o modo privado: el conteo sigue usable en memoria, solo no se retoma.
    }
  }

  /** Se borra al confirmar: el conteo ya quedó en el backend y el borrador solo confundiría. */
  borrarBorrador(retiroId: number, sucursalId: number) {
    try {
      localStorage.removeItem(claveBorrador(retiroId, sucursalId));
    } catch { /* nada que hacer */ }
  }

  hayBorrador(retiroId: number, sucursalId: number): boolean {
    const b = this.leerBorrador(retiroId, sucursalId);
    if (!b?.cantidades) return false;
    // Un borrador con todo en cero es como no haber empezado.
    return Object.values(b.cantidades).some(porMoneda =>
      Object.values(porMoneda || {}).some(c => c > 0));
  }
}
