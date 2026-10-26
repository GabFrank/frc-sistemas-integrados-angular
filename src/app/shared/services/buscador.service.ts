import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { GenericCrudService } from '../../generics/generic-crud.service';
import { LECTURA_ESTRICTA } from '../../generics/generic-crud.constantes';
import { SearchListDialogComponent, SearchListtDialogData } from '../components/search-list-dialog/search-list-dialog.component';
import { AdicionarPersonaDialogComponent } from '../../modules/personas/persona/adicionar-persona-dialog/adicionar-persona-dialog.component';
import { PersonaSearchPageGQL } from '../../modules/personas/persona/graphql/personaSearchPage';
import { ClientesSearchByPersonaGQL } from '../../modules/personas/clientes/graphql/clienteSearchByPersona';
import { ClienteService } from '../../modules/personas/clientes/cliente.service';
import { FuncionarioSearchPageGQL } from '../../modules/personas/funcionarios/graphql/funcionarioSearchPage';
import { FuncionariosACargoGQL } from '../../modules/personas/funcionarios/graphql/funcionariosACargo';
import { FuncionarioService } from '../../modules/personas/funcionarios/funcionario.service';
import { UsuarioSearchGQL } from '../../modules/personas/usuarios/graphql/usuarioSearch';
import { ProveedoresSearchByPersonaPageGQL } from '../../modules/personas/proveedor/graphql/proveedorSearchByPersonaPage';
import { ProveedorServicioSearchPageGQL } from '../../modules/personas/proveedor-servicio/graphql/proveedorServicioSearchPage';
import { CiudadesSearchGQL } from '../../modules/general/ciudad/graphql/ciudadesSearchGQL';
import { PaisSearchGQL } from '../../modules/general/pais/graphql/paisSearch';
import { MonedasSearchGQL } from '../../modules/financiero/moneda/graphql/monedasSearch';
import { VehiculoSearchPageGQL } from '../../modules/activos/vehiculos/vehiculo/graphql/vehiculoSearchPage';
import { SearchMaletinGQL } from '../../modules/financiero/maletin/graphql/searchMaletin';
import { TipoGastoSearchGQL } from '../../modules/financiero/gastos/graphql/tipoGastosSearch';
import { EnvaseSearchGQL } from '../../modules/productos/producto/graphql/envaseSearch';

/**
 * Entidades con buscador. Una lista que crece con la operacion (clientes, personas, funcionarios...)
 * no va en un mat-select: el registro que queda afuera del tope es inalcanzable sin ningun aviso.
 */
export type TipoBuscador =
  | 'cliente'
  | 'persona'
  | 'funcionario'
  | 'usuario'
  | 'proveedor'
  | 'proveedorServicio'
  | 'ciudad'
  | 'pais'
  | 'moneda'
  | 'vehiculo'
  | 'maletin'
  | 'tipoGasto'
  | 'envase';

export interface OpcionesBuscador {
  /** Reemplaza el titulo del dialogo. */
  titulo?: string;
  /** false = consulta la base de la filial en vez del central. Default: true. */
  servidor?: boolean;
  /** Descarta filas que no se pueden elegir en esta pantalla (ej. maletines inactivos). */
  filtro?: (item: any) => boolean;
  /** Variables extra de la query del dialogo (ej. `sucId` del maletin). */
  queryData?: any;
  /** Ofrece «Adicionar» en el dialogo, si la entidad lo soporta (persona). */
  adicionar?: boolean;
  /** Solo funcionario: busca entre los de las sucursales a cargo del usuario (rol RRHH SUCURSAL). */
  soloACargo?: boolean;
  /** Solo funcionario: deja afuera a los dados de baja. */
  soloActivos?: boolean;
}

/** Lo que el dialogo recibe ademas de las opciones: el texto escrito y lo que ya se encontro. */
export interface AperturaBuscador extends OpcionesBuscador {
  texto?: string;
  /** Resultados de una busqueda rapida: se muestran sin volver a consultar. */
  candidatos?: any[];
}

interface PresetBuscador {
  dialogo: (o: OpcionesBuscador) => SearchListtDialogData;
  etiqueta: (item: any) => string;
  /** Busqueda por id exacto: un numero escrito en el campo rapido se prueba primero aca. */
  porId?: (id: number, o: OpcionesBuscador) => Observable<any>;
  /** Busqueda del campo rapido. Sin ella se usa la query del dialogo. */
  rapido?: (texto: string, o: OpcionesBuscador) => Observable<any[]>;
  adicionar?: () => Observable<any>;
  ancho?: string;
}

const nombreDePersona = (p: any): string => p?.nombre != null ? p.nombre : 'SIN NOMBRE';

/**
 * Buscador generico del proyecto (SearchListDialogComponent) con la configuracion de cada entidad en un
 * solo lugar: columnas, query, etiqueta y como se busca rapido. Lo usan `app-buscador-field` y
 * `app-select-funcionario`; una pantalla nueva no arma su propio autocomplete.
 */
@Injectable({
  providedIn: 'root'
})
export class BuscadorService {
  private dialog = inject(MatDialog);
  private genericCrud = inject(GenericCrudService);
  private clienteService = inject(ClienteService);
  private funcionarioService = inject(FuncionarioService);
  private clienteSearch = inject(ClientesSearchByPersonaGQL);
  private personaSearchPage = inject(PersonaSearchPageGQL);
  private funcionariosACargo = inject(FuncionariosACargoGQL);
  private funcionarioSearchPage = inject(FuncionarioSearchPageGQL);
  private usuarioSearch = inject(UsuarioSearchGQL);
  private proveedorSearchPage = inject(ProveedoresSearchByPersonaPageGQL);
  private proveedorServicioSearchPage = inject(ProveedorServicioSearchPageGQL);
  private ciudadSearch = inject(CiudadesSearchGQL);
  private paisSearch = inject(PaisSearchGQL);
  private monedaSearch = inject(MonedasSearchGQL);
  private vehiculoSearchPage = inject(VehiculoSearchPageGQL);
  private maletinSearch = inject(SearchMaletinGQL);
  private tipoGastoSearch = inject(TipoGastoSearchGQL);
  private envaseSearch = inject(EnvaseSearchGQL);

  private readonly presets: Record<TipoBuscador, PresetBuscador> = {
    cliente: {
      dialogo: () => ({
        titulo: 'Buscar cliente',
        query: this.clienteSearch,
        tableData: [
          { id: 'persona.id', nombre: 'Id', width: '10%' },
          { id: 'persona.nombre', nombre: 'Nombre', width: '50%' },
          { id: 'tipo', nombre: 'Tipo', width: '20%' },
          { id: 'saldo', nombre: 'Saldo', width: '20%', pipe: 'number', pipeArgs: '1.0-0' }
        ]
      }),
      etiqueta: c => c?.persona?.id + ' - ' + nombreDePersona(c?.persona),
      porId: id => this.clienteService.onGetByPersonaIdFromServer(id, LECTURA_ESTRICTA),
      ancho: '70vw'
    },
    persona: {
      dialogo: () => ({
        titulo: 'Buscar persona',
        query: this.personaSearchPage,
        paginator: true,
        tableData: [
          { id: 'id', nombre: 'Id', width: '10%' },
          { id: 'nombre', nombre: 'Nombre', width: '60%' },
          { id: 'documento', nombre: 'Documento', width: '30%' }
        ]
      }),
      etiqueta: p => p?.id + ' - ' + nombreDePersona(p) + (p?.documento ? ' - ' + p.documento : ''),
      adicionar: () => this.dialog.open(AdicionarPersonaDialogComponent, { width: '700px' }).afterClosed()
    },
    funcionario: {
      // Hay homonimos (6 ESTEBAN en la base): el dialogo muestra cargo y usuario para distinguirlos.
      dialogo: o => ({
        titulo: 'Buscar funcionario',
        query: o.soloACargo ? this.funcionariosACargo : this.funcionarioSearchPage,
        // La busqueda general viene paginada del backend; funcionariosACargo es una lista corta y no.
        paginator: !o.soloACargo,
        // Los egresados se descartan en el backend: filtrar la pagina ya traida la dejaria corta.
        queryData: { soloActivos: !!o.soloActivos },
        fallbackToLocal: o.servidor !== false,
        // El campo rapido no pasa por la query del dialogo: ahi sigue haciendo falta el filtro.
        filtro: o.soloActivos && !o.soloACargo ? (f: any) => f?.activo !== false : undefined,
        tableData: [
          { id: 'id', nombre: 'Id', width: '10%' },
          { id: 'persona.nombre', nombre: 'Nombre', width: '45%' },
          { id: 'cargo.nombre', nombre: 'Cargo', width: '25%' },
          { id: 'nickname', nombre: 'Usuario', width: '20%' }
        ]
      }),
      etiqueta: f => f?.id + ' - ' + (f?.persona?.nombre ?? f?.nickname ?? 'SIN NOMBRE'),
      porId: (id, o) => this.funcionarioService.onGetFuncionarioPorPersonaSimple(id, o.servidor !== false),
      rapido: (texto, o) => this.funcionarioService.onFuncionarioSearchSimple(texto, o.servidor !== false),
      ancho: '70vw'
    },
    usuario: {
      dialogo: () => ({
        titulo: 'Buscar usuario',
        query: this.usuarioSearch,
        tableData: [
          { id: 'id', nombre: 'Id', width: '10%' },
          { id: 'persona.nombre', nombre: 'Nombre', width: '60%' },
          { id: 'nickname', nombre: 'Usuario', width: '30%' }
        ]
      }),
      etiqueta: u => u?.id + ' - ' + (u?.persona?.nombre ?? u?.nickname ?? 'SIN NOMBRE')
    },
    proveedor: {
      dialogo: () => ({
        titulo: 'Buscar proveedor',
        query: this.proveedorSearchPage,
        paginator: true,
        tableData: [
          { id: 'id', nombre: 'Id', width: '10%' },
          { id: 'persona.nombre', nombre: 'Nombre', width: '60%' },
          { id: 'persona.documento', nombre: 'Documento', width: '30%' }
        ]
      }),
      etiqueta: p => nombreDePersona(p?.persona) + (p?.persona?.documento ? ' (' + p.persona.documento + ')' : '')
    },
    proveedorServicio: {
      dialogo: () => ({
        titulo: 'Buscar proveedor de servicio',
        query: this.proveedorServicioSearchPage,
        paginator: true,
        tableData: [
          { id: 'id', nombre: 'Id', width: '10%' },
          { id: 'persona.nombre', nombre: 'Nombre', width: '45%' },
          { id: 'nombreContacto', nombre: 'Contacto', width: '25%' },
          { id: 'persona.documento', nombre: 'Documento', width: '20%' }
        ]
      }),
      etiqueta: p => p?.persona?.nombre || p?.nombreContacto || ('PROVEEDOR ' + p?.id)
    },
    ciudad: {
      dialogo: () => ({
        titulo: 'Buscar ciudad',
        query: this.ciudadSearch,
        tableData: [
          { id: 'id', nombre: 'Id', width: '15%' },
          { id: 'descripcion', nombre: 'Descripción', width: '85%' }
        ]
      }),
      etiqueta: c => c?.descripcion ?? '',
      ancho: '600px'
    },
    pais: {
      dialogo: () => ({
        titulo: 'Buscar país',
        query: this.paisSearch,
        tableData: [
          { id: 'id', nombre: 'Id', width: '10%' },
          { id: 'descripcion', nombre: 'Descripción' },
          { id: 'codigo', nombre: 'Código' }
        ]
      }),
      etiqueta: p => p?.descripcion ?? '',
      ancho: '600px'
    },
    moneda: {
      dialogo: () => ({
        titulo: 'Buscar moneda',
        query: this.monedaSearch,
        tableData: [
          { id: 'denominacion', nombre: 'Denominación' },
          { id: 'simbolo', nombre: 'Símbolo' }
        ]
      }),
      etiqueta: m => m?.denominacion ?? '',
      ancho: '400px'
    },
    vehiculo: {
      dialogo: () => ({
        titulo: 'Buscar vehículo',
        query: this.vehiculoSearchPage,
        paginator: true,
        textHint: 'Buscar por chapa, marca o modelo...',
        tableData: [
          { id: 'id', nombre: 'Id' },
          { id: 'chapa', nombre: 'Chapa' },
          { id: 'modelo.marca.descripcion', nombre: 'Marca' },
          { id: 'modelo.descripcion', nombre: 'Modelo' }
        ]
      }),
      etiqueta: v => v?.chapa ?? ''
    },
    maletin: {
      dialogo: () => ({
        titulo: 'Buscar maletín',
        query: this.maletinSearch,
        tableData: [
          { id: 'id', nombre: 'Id', width: '15%' },
          { id: 'descripcion', nombre: 'Código', width: '55%' },
          { id: 'abierto', nombre: 'En uso', width: '30%', pipe: 'booleanLock' }
        ]
      }),
      etiqueta: m => m?.descripcion ?? '',
      ancho: '600px'
    },
    tipoGasto: {
      dialogo: () => ({
        titulo: 'Seleccionar tipo de gasto',
        query: this.tipoGastoSearch,
        tableData: [
          { id: 'id', nombre: 'ID', width: '70px' },
          { id: 'descripcion', nombre: 'Descripción', width: 'auto' },
          { id: 'autorizacion', nombre: 'Requiere autorización', width: '220px', pipe: 'booleanLock' }
        ]
      }),
      etiqueta: t => t?.id + ' - ' + (t?.descripcion ?? '')
    },
    envase: {
      dialogo: () => ({
        titulo: 'Buscar envase',
        query: this.envaseSearch,
        queryData: { isEnvase: true },
        tableData: [
          { id: 'id', nombre: 'Id', width: '15%' },
          { id: 'descripcion', nombre: 'Descripción', width: '60%' },
          { id: 'precioPrincipal', nombre: 'Precio', width: '25%', pipe: 'number', pipeArgs: '1.0-0' }
        ]
      }),
      etiqueta: e => e?.id + ' - ' + (e?.descripcion ?? ''),
      ancho: '70vw'
    }
  };

  etiqueta(tipo: TipoBuscador, item: any): string {
    return item != null ? this.presets[tipo].etiqueta(item) : '';
  }

  /**
   * Abre el buscador. Emite lo elegido, o `null` si se cerro sin elegir. Con `candidatos` muestra esos
   * resultados sin volver a consultar; el boton Buscar consulta de nuevo con lo que se escriba.
   */
  abrir(tipo: TipoBuscador, apertura: AperturaBuscador = {}): Observable<any> {
    const preset = this.presets[tipo];
    const data = this.armarDialogo(tipo, apertura);
    const texto = apertura.texto?.trim();
    if (apertura.candidatos?.length > 0) {
      data.inicialData = apertura.candidatos;
      data.inicialSearch = false;
    } else {
      data.inicialSearch = true;
    }
    // El dialogo toma el texto inicial de queryData (sin buscar) o de `texto` (al buscar de entrada).
    if (texto) {
      data.texto = texto;
      data.queryData = { ...(data.queryData || {}), [data.searchFieldName || 'texto']: texto };
    }
    return this.dialog.open(SearchListDialogComponent, {
      data,
      width: preset.ancho || '60vw',
      height: '80vh',
      panelClass: 'search-dialog-dark'
    }).afterClosed().pipe(
      switchMap(res => {
        if (res?.adicionar === true) {
          return preset.adicionar != null ? preset.adicionar() : of(null);
        }
        return of(res ?? null);
      })
    );
  }

  /**
   * Busqueda del campo rapido: un numero se prueba primero como id exacto (si la entidad lo admite) y si no,
   * por texto. Los errores llegan al `error:` de quien llama, que es quien avisa.
   */
  buscarRapido(tipo: TipoBuscador, texto: string, opciones: OpcionesBuscador = {}): Observable<any[]> {
    const preset = this.presets[tipo];
    const limpio = (texto ?? '').trim();
    // El mismo filtro que el dialogo: lo que no se puede elegir alla tampoco se elige rapido.
    const filtro = this.armarDialogo(tipo, opciones).filtro;
    const filtrar = (filas: any[]) => filtro ? (filas || []).filter(filtro) : (filas || []);
    const porTexto = () => (preset.rapido != null
      ? preset.rapido(limpio, opciones)
      : this.buscarConQueryDelDialogo(tipo, limpio, opciones)
    ).pipe(map(filtrar));
    if (preset.porId != null && /^\d+$/.test(limpio)) {
      return preset.porId(+limpio, opciones).pipe(
        switchMap(res => res?.id != null ? of(filtrar([res])) : porTexto())
      );
    }
    return porTexto();
  }

  private buscarConQueryDelDialogo(tipo: TipoBuscador, texto: string, opciones: OpcionesBuscador): Observable<any[]> {
    const data = this.armarDialogo(tipo, opciones);
    const variables = { ...(data.queryData || {}), [data.searchFieldName || 'texto']: texto.toUpperCase() };
    if (data.paginator) {
      variables.page = 0;
      variables.size = 15;
    }
    return this.genericCrud.onCustomQuery(data.query, variables, data.isServidor, LECTURA_ESTRICTA, true).pipe(
      map(res => (data.paginator ? res?.getContent : res) || [])
    );
  }

  private armarDialogo(tipo: TipoBuscador, opciones: OpcionesBuscador): SearchListtDialogData {
    const data = this.presets[tipo].dialogo(opciones);
    data.isServidor = opciones.servidor !== false;
    if (opciones.titulo) data.titulo = opciones.titulo;
    if (opciones.filtro) data.filtro = opciones.filtro;
    if (opciones.queryData) data.queryData = { ...(data.queryData || {}), ...opciones.queryData };
    data.isAdicionar = opciones.adicionar === true && this.presets[tipo].adicionar != null;
    return data;
  }
}
