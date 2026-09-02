import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  CATEGORIA_LABEL, EstadoCasoRetiro, RetiroCaso, VEREDICTO_EXIGE_RESPONSABLE, VEREDICTO_LABEL,
  VeredictoCasoRetiro,
} from '../retiro-verificacion.model';
import { RetiroVerificacionService } from '../retiro-verificacion.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../../notificacion-snackbar.service';
import { CajaService } from '../../../pdv/caja/caja.service';
import { CajaBalance } from '../../../pdv/caja/caja.model';

export interface DetalleCasoDialogData {
  caso: RetiroCaso;
  /**
   * Cierra o solo mira. El mismo diálogo sirve para las dos cosas — el investigador necesita
   * ver exactamente lo mismo que cualquiera que consulte — pero el botón del ojo abre en
   * lectura y el de Resolver habilita el cierre. Dos botones que hacen lo mismo confunden.
   */
  puedeResolver: boolean;
}

/** Una moneda del conteo, con todo precalculado para el HTML. */
interface FilaDetalle {
  moneda: string;
  simbolo: string;
  declarado: number;
  contado: number;
  diferencia: number;
  categoria: string;
  formato: string;
  color: string;
  cierra: boolean;
}

/** Una línea del resumen de la jornada del PDV, ya formateada. */
interface FilaJornada {
  concepto: string;
  gs: number;
  rs: number;
  ds: number;
  /** La diferencia del arqueo del propio cajero se lee distinto que una venta. */
  destacada?: boolean;
}

/** Opción de veredicto con lo que arrastra cada una. */
interface OpcionVeredicto {
  valor: VeredictoCasoRetiro;
  label: string;
  ayuda: string;
}

/**
 * Detalle de un caso, para investigarlo y cerrarlo.
 *
 * La diferencia entre lo declarado y lo contado es una discrepancia entre **dos versiones del
 * mismo hecho**, no una acusación: el cajero dice que mandó X, tesorería dice que contó Y. Por
 * eso el diálogo muestra los dos lados — el conteo de tesorería y la jornada del PDV de donde
 * salió el retiro — y obliga a cerrar con un veredicto que nombre el lado.
 *
 * El informe explica; el veredicto es lo único que después se puede contar.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-detalle-caso-dialog',
  templateUrl: './detalle-caso-dialog.component.html',
  styleUrls: ['./detalle-caso-dialog.component.scss'],
})
export class DetalleCasoDialogComponent implements OnInit {

  filas: FilaDetalle[] = [];
  resolucion = '';
  guardando = false;

  contadoPor = '';
  rapida = false;
  observacionTesoreria = '';
  estadoLabel = '';
  esResuelto = false;

  // ── Lado que entrega ──────────────────────────────────────────────────────────────────
  cajero = '';
  cajaSalidaId: number = null;
  fechaRetiro: Date = null;
  jornada: FilaJornada[] = [];
  cargandoJornada = false;
  jornadaNoDisponible = false;

  // ── Cierre ────────────────────────────────────────────────────────────────────────────
  veredicto: VeredictoCasoRetiro = null;
  veredictoLabel = '';
  responsablePersonaId: number = null;
  responsableNombre = '';
  reintegroRetiroId: number = null;
  anularVerificacion = true;

  opciones: OpcionVeredicto[] = [
    {
      valor: VeredictoCasoRetiro.FALTANTE_PDV, label: VEREDICTO_LABEL.FALTANTE_PDV,
      ayuda: 'Al sobre le faltó: se declararon más billetes de los que llegaron. Si esa plata '
        + 'quedó en la caja del cajero, igual corresponde este veredicto.',
    },
    {
      valor: VeredictoCasoRetiro.SOBRANTE_PDV, label: VEREDICTO_LABEL.SOBRANTE_PDV,
      ayuda: 'Al sobre le sobró: llegaron más billetes de los declarados.',
    },
    {
      valor: VeredictoCasoRetiro.ERROR_DE_CONTEO_TESORERIA,
      label: VEREDICTO_LABEL.ERROR_DE_CONTEO_TESORERIA,
      ayuda: 'Contó mal quien recibió. Lo acreditado en la caja quedó equivocado.',
    },
    {
      valor: VeredictoCasoRetiro.REINTEGRADO, label: VEREDICTO_LABEL.REINTEGRADO,
      ayuda: 'La diferencia se repuso después, en otro retiro.',
    },
    {
      valor: VeredictoCasoRetiro.ASUMIDO_SIN_RESPONSABLE,
      label: VEREDICTO_LABEL.ASUMIDO_SIN_RESPONSABLE,
      ayuda: 'No se pudo determinar de qué lado estuvo. La empresa la asume.',
    },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DetalleCasoDialogData,
    private dialogRef: MatDialogRef<DetalleCasoDialogComponent>,
    private service: RetiroVerificacionService,
    private cajaService: CajaService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    const c = this.data.caso;
    const v = c?.verificacion;
    this.contadoPor = v?.usuario?.persona?.nombre || '—';
    this.rapida = !!v?.rapida;
    this.observacionTesoreria = v?.observacion || '';
    this.esResuelto = c?.estado === EstadoCasoRetiro.RESUELTO;
    this.resolucion = c?.resolucion || '';
    this.veredicto = c?.veredicto || null;
    this.veredictoLabel = c?.veredicto ? VEREDICTO_LABEL[c.veredicto] : '';
    this.responsablePersonaId = c?.responsablePersona?.id || null;
    this.responsableNombre = c?.responsablePersona?.nombre || '';
    this.reintegroRetiroId = c?.reintegroRetiroId || null;
    this.estadoLabel = c?.estado === EstadoCasoRetiro.ABIERTO ? 'Abierto'
      : c?.estado === EstadoCasoRetiro.EN_INVESTIGACION ? 'En investigación' : 'Resuelto';

    // Se muestran TODAS las monedas del retiro, no solo las que difieren: que una haya
    // cerrado también es información para quien investiga.
    this.filas = (v?.detalles || []).map(d => {
      const dec = d.moneda?.decimales != null ? d.moneda.decimales : 0;
      const dif = d.diferencia || 0;
      const cierra = Math.abs(dif) <= 0.005;
      return {
        moneda: d.moneda?.denominacion || '—',
        simbolo: d.moneda?.simbolo || '',
        declarado: d.declarado || 0,
        contado: d.contado || 0,
        diferencia: dif,
        categoria: d.categoria ? CATEGORIA_LABEL[d.categoria] : '',
        formato: `1.0-${dec}`,
        color: cierra ? '#81c784' : (dif < 0 ? '#ff8a80' : '#64b5f6'),
        cierra,
      };
    });

    this.cargarLadoQueEntrega();
  }

  /**
   * El otro lado de la discrepancia: quién armó el retiro y cómo venía su jornada.
   *
   * El balance del PDV es el mismo que ve el cajero en su pantalla de ventas — incluye su
   * propia diferencia de arqueo, que es el dato que más rápido explica un faltante: si la caja
   * ya cerraba mal antes del retiro, el problema no nació en el traslado.
   */
  private cargarLadoQueEntrega() {
    const r = this.data.caso?.retiro;
    this.cajero = r?.responsable?.persona?.nombre || r?.usuario?.persona?.nombre || '—';
    this.fechaRetiro = r?.creadoEn || null;
    this.cajaSalidaId = r?.cajaSalida?.id || null;
    // Si el veredicto todavía no se eligió, el candidato natural es el cajero: es de su caja
    // que salió la plata. Se puede cambiar cuando el veredicto apunta al otro lado.
    if (!this.responsablePersonaId) {
      this.responsablePersonaId = r?.responsable?.persona?.id || r?.usuario?.persona?.id || null;
      this.responsableNombre = this.cajero;
    }

    const sucursalId = r?.cajaSalida?.sucursalId ?? this.data.caso?.sucursalId;
    if (!this.cajaSalidaId || !sucursalId) {
      this.jornadaNoDisponible = true;
      return;
    }
    this.cargandoJornada = true;
    this.cajaService.onCajaBalancePorIdAndSucursalId(this.cajaSalidaId, sucursalId)
      .pipe(untilDestroyed(this)).subscribe({
        next: (b: CajaBalance) => {
          this.cargandoJornada = false;
          if (b == null) { this.jornadaNoDisponible = true; return; }
          this.jornada = [
            { concepto: 'Ventas', gs: b.totalVentaGs, rs: b.totalVentaRs, ds: b.totalVentaDs },
            { concepto: 'Retiros', gs: b.totalRetiroGs, rs: b.totalRetiroRs, ds: b.totalRetiroDs },
            { concepto: 'Gastos', gs: b.totalGastoGs, rs: b.totalGastoRs, ds: b.totalGastoDs },
            { concepto: 'Vueltos', gs: b.vueltoGs, rs: b.vueltoRs, ds: b.vueltoDs },
            {
              concepto: 'Diferencia de la caja', gs: b.diferenciaGs, rs: b.diferenciaRs,
              ds: b.diferenciaDs, destacada: true,
            },
          ];
        },
        error: () => { this.cargandoJornada = false; this.jornadaNoDisponible = true; },
      });
  }

  onVeredicto(v: VeredictoCasoRetiro) {
    this.veredicto = v;
    // Contó mal tesorería ⇒ el responsable es el que contó, no el cajero.
    if (v === VeredictoCasoRetiro.ERROR_DE_CONTEO_TESORERIA) {
      const u = this.data.caso?.verificacion?.usuario;
      this.responsablePersonaId = u?.persona?.id || null;
      this.responsableNombre = u?.persona?.nombre || '—';
    } else if (VEREDICTO_EXIGE_RESPONSABLE.indexOf(v) >= 0) {
      const r = this.data.caso?.retiro;
      this.responsablePersonaId = r?.responsable?.persona?.id || r?.usuario?.persona?.id || null;
      this.responsableNombre = this.cajero;
    }
  }

  get exigeResponsable(): boolean {
    return VEREDICTO_EXIGE_RESPONSABLE.indexOf(this.veredicto) >= 0;
  }

  get esReintegro(): boolean {
    return this.veredicto === VeredictoCasoRetiro.REINTEGRADO;
  }

  get esErrorDeConteo(): boolean {
    return this.veredicto === VeredictoCasoRetiro.ERROR_DE_CONTEO_TESORERIA;
  }

  onResolver() {
    if (this.guardando) return;
    if (!this.veredicto) {
      return this.avisar('Elegí un veredicto: es lo que después se puede contar.');
    }
    if (!this.resolucion || this.resolucion.trim().length < 10) {
      return this.avisar('Escribí qué se encontró antes de resolver el caso.');
    }
    if (this.exigeResponsable && !this.responsablePersonaId) {
      return this.avisar('Este veredicto necesita un responsable identificado.');
    }
    if (this.esReintegro && !this.reintegroRetiroId) {
      return this.avisar('Indicá el retiro por el que se repuso la diferencia.');
    }
    const choque = this.veredictoContraElConteo();
    if (choque) return this.avisar(choque);

    this.guardando = true;
    this.service.onResolverCaso(this.data.caso.id, {
      veredicto: this.veredicto,
      resolucion: this.resolucion,
      responsablePersonaId: this.exigeResponsable ? this.responsablePersonaId : null,
      reintegroRetiroId: this.esReintegro ? this.reintegroRetiroId : null,
      anularVerificacion: this.esErrorDeConteo && this.anularVerificacion,
    }).pipe(untilDestroyed(this)).subscribe({
      next: r => {
        this.guardando = false;
        if (r != null) this.dialogRef.close(r);
      },
      error: err => {
        this.guardando = false;
        this.avisar(err?.graphQLErrors?.[0]?.message || err?.message || 'No se pudo resolver');
      },
    });
  }

  /**
   * El veredicto se mide desde el sobre; la caja del cajero muestra el mismo hecho invertido.
   * Se avisa acá antes de mandar porque un error de negocio del backend deja el observable
   * colgado (GenericCrudService.onSaveCustom) y el usuario nunca vería el motivo.
   */
  private veredictoContraElConteo(): string {
    const hayFaltante = this.filas.some(f => f.diferencia < -0.005);
    const haySobrante = this.filas.some(f => f.diferencia > 0.005);
    if (this.veredicto === VeredictoCasoRetiro.FALTANTE_PDV && !hayFaltante) {
      return haySobrante
        ? 'El conteo dice que vino de más, no de menos. Revisá el veredicto.'
        : 'Este retiro no tiene faltante registrado.';
    }
    if (this.veredicto === VeredictoCasoRetiro.SOBRANTE_PDV && !haySobrante) {
      return hayFaltante
        ? 'El conteo dice que vino de menos. Si la plata quedó en la caja del cajero, al sobre igual le faltó.'
        : 'Este retiro no tiene sobrante registrado.';
    }
    return null;
  }

  private avisar(texto: string) {
    this.notificacion.notification$.next({ texto, color: NotificacionColor.warn, duracion: 4 });
  }

  onCerrar() {
    this.dialogRef.close(null);
  }
}
