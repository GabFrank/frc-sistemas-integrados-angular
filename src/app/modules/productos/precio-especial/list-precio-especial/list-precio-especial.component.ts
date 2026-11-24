import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { PROPAGAR_ERROR_DE_RED, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { PrecioEspecialSucursal } from '../precio-especial.model';
import { PrecioEspecialService } from '../precio-especial.service';
import {
  detalleAlCortar, ESTADO_PRECIO_ESPECIAL_TEXTO, EstadoPrecioEspecial, esPrecioInactivo, estadoPrecioEspecial, textoVigencia,
} from '../precio-especial.util';

/** Fila ya resuelta: el template no llama funciones (regla del repo). */
interface FilaPrecioEspecial {
  especial: PrecioEspecialSucursal;
  presentacion: string;
  vigencia: string;
  estado: EstadoPrecioEspecial;
  estadoTexto: string;
  /** El precio global no rige en ninguna sucursal: solo la promoción lo habilita. */
  precioInactivo: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-precio-especial',
  templateUrl: './list-precio-especial.component.html',
  styleUrls: ['./list-precio-especial.component.scss'],
})
export class ListPrecioEspecialComponent implements OnInit {
  displayedColumns = ['id', 'sucursal', 'producto', 'presentacion', 'tipoPrecio', 'global', 'precio', 'vigencia', 'estado', 'usuario', 'acciones'];
  sucursalIdControl = new FormControl<number>(null);
  textoControl = new FormControl<string>(null);
  soloVigentesControl = new FormControl<boolean>(true);
  sucursales: Sucursal[] = [];
  sucursalesFallo = false;

  /**
   * Promociones paginadas en el central (#772). Si falla un filtro la grilla queda vacía (lo anterior no corresponde
   * a los filtros a la vista); si falla un cambio de página o releer tras cortar, se conserva lo que se ve (#390).
   */
  pag = new PaginacionLista<FilaPrecioEspecial>({
    cargar: (page, size) => this.service.onFiltrar(this.armarParams(page, size)).pipe(
      map(res => res && { getTotalElements: res.getTotalElements ?? 0, getContent: this.aFilas(res.getContent ?? []) })
    ),
    pageSize: 15,
    alFallar: () => {
      // Un cambio de página fallido solo avisa: la página a la vista sigue siendo buena (sin cartel).
      this.cartelFallo = this.avisoAlFallar != null;
      this.notificacionService.openWarn(this.avisoAlFallar ?? 'No se pudo cambiar de página: volvé a intentar.', 5);
      this.avisoAlFallar = null;
    },
    alCargar: () => {
      this.avisoAlFallar = null;
      this.cartelFallo = false;
    },
  });
  /** Cartel con «Reintentar»: falló un filtro (grilla vacía) o releer tras cortar (filas que pueden no reflejarlo). */
  cartelFallo = false;
  /** El aviso si falla la carga en curso; sin él (cambio de página desde el paginador) va el de página. */
  private avisoAlFallar: string | null = null;

  constructor(
    private service: PrecioEspecialService,
    private sucursalService: SucursalService,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.cargarSucursales();
    this.onGetData();
  }

  cargarSucursales(): void {
    this.sucursalesFallo = false;
    this.sucursalService
      .onGetAllSucursales(true, PROPAGAR_ERROR_DE_RED, { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true })
      .pipe(untilDestroyed(this))
      .subscribe({ error: () => {
        this.sucursalesFallo = true;
        this.notificacionService.openWarn('No se pudieron cargar las sucursales del filtro: usá «Reintentar».', 5);
      }, next: (res) => {
        if (res == null) {
          this.sucursalesFallo = true; // error del servidor: ya se avisó
          return;
        }
        this.sucursales = res.filter((s) => Number(s.id) !== 0);
      } });
  }

  /** `filtro` (por defecto, también Reintentar): página 1. `releer`: tras cortar, se repite la página a la vista. */
  onGetData(modo: 'filtro' | 'releer' = 'filtro'): void {
    if (modo === 'releer') {
      this.avisoAlFallar = 'No se pudo actualizar la lista: puede no reflejar el último cambio.';
      this.pag.recargar();
    } else {
      this.avisoAlFallar = 'No se pudieron cargar las promociones: volvé a intentar.';
      this.pag.filtrar();
    }
  }

  private armarParams(page: number, size: number): any {
    const params: any = { page, size, soloVigentes: !!this.soloVigentesControl.value };
    if (this.sucursalIdControl.value != null) params.sucursalId = Number(this.sucursalIdControl.value);
    if (this.textoControl.value) params.texto = this.textoControl.value;
    return params;
  }

  private aFilas(especiales: PrecioEspecialSucursal[]): FilaPrecioEspecial[] {
    const hoy = new Date();
    return especiales.map((e) => {
      const p = e.precioPorSucursal?.presentacion;
      const estado = estadoPrecioEspecial(e, hoy);
      return {
        especial: e,
        presentacion: (p?.descripcion || `x${p?.cantidad ?? ''}`).toUpperCase(),
        vigencia: textoVigencia(e),
        estado,
        estadoTexto: ESTADO_PRECIO_ESPECIAL_TEXTO[estado],
        precioInactivo: esPrecioInactivo(e.precioPorSucursal),
      };
    });
  }

  onFilter(): void {
    this.onGetData();
  }

  onLimpiarFiltros(): void {
    this.sucursalIdControl.setValue(null);
    this.textoControl.setValue(null);
    this.soloVigentesControl.setValue(true);
    this.onFilter();
  }

  onCortar(fila: FilaPrecioEspecial): void {
    const e = fila.especial;
    this.dialogosService
      .confirm('Cortar promoción', `¿Cortar la promoción de ${e.sucursal?.nombre}?`,
        detalleAlCortar(fila.precioInactivo))
      .pipe(untilDestroyed(this))
      .subscribe((ok) => {
        // También en error: pudo haberse aplicado (onSaveCustom ya avisó), y la lista lo aclara
        if (ok) this.service.onCortar(e.id).pipe(untilDestroyed(this)).subscribe({ next: () => this.onGetData('releer'), error: () => this.onGetData('releer') });
      });
  }
}
