import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { GenericCrudService, QueryError, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../generics/generic-crud.service';
import { LECTURA_ESTRICTA } from '../../../generics/generic-crud.constantes';
import { MonedasGetAllGQL } from './graphql/monedasGetAll';
import { MonedasAbmGQL } from './graphql/monedasAbm';
import { SaveMonedaGQL } from './graphql/saveMoneda';
import { DeleteMonedaGQL } from './graphql/deleteMoneda';
import { Moneda } from './moneda.model';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CurrencyMaskInputMode } from 'ngx-currency';
import { UsuarioService } from '../../personas/usuarios/usuario.service';
import { MainService } from '../../../main.service';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root'
})
export class MonedaService {

  currencyOptionsGuarani = {
    allowNegative: true,
    precision: 0,
    thousands: ".",
    nullable: false,
    inputMode: CurrencyMaskInputMode.NATURAL,
    align: "right",
    allowZero: true,
    decimal: null,
    prefix: "",
    suffix: "",
    max: null,
    min: null,
  };

  currencyOptionsNoGuarani = {
    allowNegative: true,
    precision: 2,
    thousands: ",",
    nullable: false,
    inputMode: CurrencyMaskInputMode.FINANCIAL,
    align: "right",
    allowZero: true,
    decimal: ".",
    prefix: "",
    suffix: "",
    max: null,
    min: null,
  };

  constructor(
    private getAllMonedas: MonedasGetAllGQL,
    private saveMonedaGQL: SaveMonedaGQL,
    private deleteMonedaGQL: DeleteMonedaGQL,
    private monedasAbmGQL: MonedasAbmGQL,
    private genericService: GenericCrudService,
    private mainService: MainService
  ) {
    // mainService.usuarioActual != null ? this.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
    //   if(res!=null){
    //     this.monedaList = res;
    //   }
    // }) : null;
  }

  /** `null` = no se pudieron leer (el genérico ya avisó, salvo que `errorConf` diga otra cosa). */
  onGetAll(servidor: boolean = true, errorConf?: QueryError): Observable<Moneda[]>{
    return this.genericService.onGetAll(this.getAllMonedas, null, null, servidor, errorConf);
  }

  /**
   * Igual que {@link onGetAll} contra el central, para consultas de fondo (el header): sin spinner
   * global, corte a los 20 s sin aviso, y el error de red se propaga al que llama.
   * `servidor = false` las lee del filial (la etiqueta de precio); `errorConf` permite callar el aviso del
   * servicio cuando quien llama muestra el suyo. Sin parámetros se comporta como siempre.
   */
  onGetAllEnSegundoPlano(servidor: boolean = true,
                         errorConf: QueryError = { networkError: { propagate: true } }): Observable<Moneda[]> {
    return this.genericService.onCustomQuery(
      this.getAllMonedas,
      {},
      servidor,
      errorConf,
      true,
      { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true }
    );
  }

  /**
   * Las monedas del ABM, con `codigoIso`. Falla (sin aviso) contra un central que no conoce el
   * campo: quien llama vuelve a {@link onGetAll} y oculta el código ISO.
   */
  onGetAllAbm(): Observable<Moneda[]> {
    return this.genericService.onCustomQuery(this.monedasAbmGQL, {}, true, LECTURA_ESTRICTA);
  }

  onSave(moneda: Moneda, opciones?: { avisarExito?: boolean }): Observable<Moneda> {
    let aux = moneda;
    if (!(moneda instanceof Moneda)) {
      aux = new Moneda();
      Object.assign(aux, moneda);
    }
    return this.genericService.onSaveCustom(this.saveMonedaGQL, { entity: aux.toInput() }, true, opciones);
  }

  onDelete(id: number, opciones?: { avisarExito?: boolean }): Observable<boolean> {
    return this.genericService.onSaveCustom(this.deleteMonedaGQL, { id }, true, opciones);
  }

  /**
   * Máscara de los montos con el formato de siempre del sistema: sin decimales con miles «.»
   * (guaraní), o con decimales en formato financiero, miles «,» y decimal «.».
   *
   * Decide por `decimales` de la moneda; si la moneda no lo trae (una consulta que no lo pide), por
   * la regla de antes: la denominación `GUARANI`. Con 0 y 2 decimales devuelve los mismos objetos de
   * siempre, así PYG/USD/BRL quedan idénticos.
   */
  currencyOptionsByMoneda(moneda: Moneda): any {
    const decimales = moneda?.decimales != null
      ? moneda.decimales
      : (moneda?.denominacion === 'GUARANI' ? 0 : 2);
    if (decimales <= 0) return this.currencyOptionsGuarani;
    if (decimales === this.currencyOptionsNoGuarani.precision) return this.currencyOptionsNoGuarani;
    return { ...this.currencyOptionsNoGuarani, precision: decimales };
  }

  /**
   * Decimales de una moneda para los montos de tesorería: `decimales` si viene, si no 0 para una
   * denominación que contiene «GUARANI» y 2 para el resto (la regla de las copias locales que
   * reemplaza; distinta de la de {@link currencyOptionsByMoneda}, que compara la denominación exacta).
   */
  decimalesDeMoneda(moneda: Partial<Moneda> | null): number {
    return moneda?.decimales != null
      ? moneda.decimales
      : ((moneda?.denominacion || '').toUpperCase().includes('GUARANI') ? 0 : 2);
  }

  /**
   * Máscara de un monto positivo en formato PY: miles «.», decimal «,», el símbolo como prefijo y
   * sin negativos. Es la de los diálogos de tesorería (ajuste de saldo, operación financiera, pago de
   * compras, maletín), que antes tenía cada uno su copia.
   *
   * `allowZero` solo se incluye si se pasa (el ajuste de saldo nunca lo fijó). `decimalSinDecimales`
   * es el separador decimal de una moneda sin decimales: `''` por defecto, `','` para el ajuste de
   * saldo, que lo dejaba fijo.
   */
  currencyOptionsMontoPositivo(moneda: Partial<Moneda> | null,
                               opciones: { allowZero?: boolean; decimalSinDecimales?: string } = {}): any {
    const decimales = this.decimalesDeMoneda(moneda);
    const mascara: any = {
      align: 'right',
      allowNegative: false,
      precision: decimales,
      thousands: '.',
      decimal: decimales > 0 ? ',' : (opciones.decimalSinDecimales ?? ''),
      prefix: moneda?.simbolo ? moneda.simbolo + ' ' : '',
      suffix: '',
      nullable: true,
      min: 0,
      max: null,
    };
    if (opciones.allowZero !== undefined) mascara.allowZero = opciones.allowZero;
    return mascara;
  }
}
