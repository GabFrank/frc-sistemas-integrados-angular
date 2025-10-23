import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { PageInfo } from '../../../app.component';
import { MatTableDataSource } from '@angular/material/table';
import { PdvCaja, PdvCajaEstado, CajaBalance } from '../pdv/caja/caja.model';
import { trigger, state, style, transition, animate } from '@angular/animations';

type DataRow = Omit<PdvCaja, 'toInput'> & { 
  estadoDiferencia?: string; 
  cajaAnteriorId?: number; 
  cajaAnteriorData?: PdvCaja; 
  montosCalculados?: {
    apertura: { gs: number, rs: number, ds: number },
    cierre: { gs: number, rs: number, ds: number }
  };
  balance?: CajaBalance;
};

enum EstadoDiferencia {
  SIN_DIFERENCIA = 'SIN_DIFERENCIA',
  POCA_DIFERENCIA = 'POCA_DIFERENCIA',
  MEDIA_DIFERENCIA = 'MEDIA_DIFERENCIA',
  CON_DIFERENCIA = 'CON_DIFERENCIA',
  MUCHA_DIFERENCIA = 'MUCHA_DIFERENCIA',
  SIN_DATOS = 'SIN_DATOS'
}
import { CajaService } from '../pdv/caja/caja.service';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../empresarial/sucursal/sucursal.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Router } from '@angular/router';
import { Tab } from '../../../layouts/tab/tab.model';
import { TabData, TabService } from '../../../layouts/tab/tab.service';
import { AdicionarCajaDialogComponent } from '../pdv/caja/adicionar-caja-dialog/adicionar-caja-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../shared/components/search-list-dialog/search-list-dialog.component';
import { Maletin } from '../maletin/maletin.model';
import { SearchMaletinGQL } from '../maletin/graphql/searchMaletin';
import { VentaService } from '../../operaciones/venta/venta.service';
import { Venta } from '../../operaciones/venta/venta.model';
import { MonedaService } from '../moneda/moneda.service';
import { Moneda } from '../moneda/moneda.model';
import { of, forkJoin, combineLatest, BehaviorSubject } from 'rxjs';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'analisis-diferencia',
  templateUrl: './analisis-diferencia.component.html',
  styleUrls: ['./analisis-diferencia.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class AnalisisDiferenciaComponent implements OnInit {

  isLoadingMaletin = false;
  isLoadingCaja = false;
  isLoadingInitialData = true;
  isLoadingGlobal = false;
  
  private loadingMaletinSubject = new BehaviorSubject<boolean>(false);
  private loadingCajaSubject = new BehaviorSubject<boolean>(false);
  
  private bothTablesLoaded$ = combineLatest([
    this.loadingMaletinSubject,
    this.loadingCajaSubject
  ]).pipe(
    untilDestroyed(this)
  );

  diferenciaMaletinColumns: string[] = ['cierre', 'sucursal', 'maletin', 'cierreCaja', 'aperturaCaja', 'estado'];
  diferenciaMaletinDataSource = new MatTableDataSource<DataRow>([]);
  diferenciaMaletinFilters: FormGroup;
  totalElementsMaletin: number = 0;
  selectedPageInfo: PageInfo<PdvCaja>;
  pageIndexMaletin: number = 0;
  pageSizeMaletin: number = 10;
  expandedElementMaletin: DataRow | null = null;

  diferenciaCajaDataSource = new MatTableDataSource<DataRow>([]);
  diferenciaCajaColumns: string[] = ['fechaApertura', 'sucursal', 'maletin', 'cierreCaja', 'estado'];
  diferenciaCajaFilters: FormGroup;
  totalElementsCaja: number = 0;
  selectedPageInfoCaja: PageInfo<PdvCaja>;
  pageIndexCaja: number = 0;
  pageSizeCaja: number = 10;
  expandedElementCaja: DataRow | null = null;

  sucursalList: Sucursal[] = [];
  
  monedasList: Moneda[] = [];
  
  globalCajaFilter = new FormControl('');
  
  private verificarCompletado: () => void;

  constructor(
    private fb: FormBuilder,
    private cajaService: CajaService,
    private sucursalService: SucursalService,
    private router: Router,
    private tabService: TabService,
    private matDialog: MatDialog,
    private searchMaletinGQL: SearchMaletinGQL,
    private ventaService: VentaService,
    private monedaService: MonedaService
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadInitialData();
    this.subscribeToFilterChanges();
  }

  loadInitialData(): void {
    this.isLoadingInitialData = true;
    
    forkJoin({
      sucursales: this.sucursalService.onGetAllSucursalesByActive(true, true),
      monedas: this.monedaService.onGetAll(false)
    }).pipe(untilDestroyed(this)).subscribe({
      next: (results) => {
        this.sucursalList = results.sucursales?.filter(sucursal => 
          sucursal.nombre != "SERVIDOR" && sucursal.nombre != "COMPRAS") || [];
        
        this.monedasList = results.monedas || [];
        
        setTimeout(() => {
          this.loadTablesData();
        }, 200);
      },
      error: (error) => {
        console.error('Error cargando datos iniciales:', error);
        setTimeout(() => {
          this.loadTablesData();
        }, 200);
      }
    });
  }

  loadTablesData(): void {
    this.isLoadingInitialData = false;
    
    setTimeout(() => {
      this.isLoadingMaletin = true;
      this.isLoadingCaja = true;
      
      this.loadDiferenciasMaletin();
      this.loadDiferenciasCaja();
    }, 100); 
  }

  calcularEstadoDiferencia(diferenciaGs: number, diferenciaRs: number, diferenciaDs: number): string {
    const monedaReal = this.monedasList.find(m => m.denominacion === 'REAL');
    const monedaDolar = this.monedasList.find(m => m.denominacion === 'DOLAR');
    
    const cotizacionReal = monedaReal?.cambio || 130;
    const cotizacionDolar = monedaDolar?.cambio || 7000;
    
    const diferenciaTotalGs = Math.abs(diferenciaGs || 0) + 
                             Math.abs(diferenciaRs || 0) * cotizacionReal + 
                             Math.abs(diferenciaDs || 0) * cotizacionDolar;
    
    const UMBRAL_POCA_DIFERENCIA = 5000;
    const UMBRAL_MEDIA_DIFERENCIA = 20000;
    const UMBRAL_CON_DIFERENCIA = 50000;
    const UMBRAL_MUCHA_DIFERENCIA = 100000;
    
    if (diferenciaTotalGs === 0) {
      return EstadoDiferencia.SIN_DIFERENCIA;
    } else if (diferenciaTotalGs <= UMBRAL_POCA_DIFERENCIA) {
      return EstadoDiferencia.POCA_DIFERENCIA;
    } else if (diferenciaTotalGs <= UMBRAL_MEDIA_DIFERENCIA) {
      return EstadoDiferencia.MEDIA_DIFERENCIA;
    } else if (diferenciaTotalGs <= UMBRAL_CON_DIFERENCIA) {
      return EstadoDiferencia.CON_DIFERENCIA;
    } else if (diferenciaTotalGs <= UMBRAL_MUCHA_DIFERENCIA) {
      return EstadoDiferencia.CON_DIFERENCIA;
    } else {
      return EstadoDiferencia.MUCHA_DIFERENCIA;
    }
  }

  initForms(): void {
    const fechaInicial = new Date();
    fechaInicial.setDate(fechaInicial.getDate() - 1);
    
    this.diferenciaMaletinFilters = this.fb.group({
      fechaCierre: [fechaInicial],
      maletinDescripcion: [null],
      cajaAnteriorId: [null],
      estadoDiferencia: ['TODAS'],
      sucursalId: [null]
    });

    this.diferenciaCajaFilters = this.fb.group({
      fechaApertura: [fechaInicial],
      maletinDescripcion: [null],
      maletinId: [null],
      cajaAnteriorId: [null],
      estadoDiferencia: ['TODAS'],
      sucursalId: [null]
    });
  }



  subscribeToFilterChanges(): void {
    this.diferenciaMaletinFilters.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      untilDestroyed(this)
    ).subscribe(() => {
      this.pageIndexMaletin = 0;
      this.loadDiferenciasMaletin();
    });

    this.diferenciaCajaFilters.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      untilDestroyed(this)
    ).subscribe(() => {
      this.pageIndexCaja = 0;
      this.loadDiferenciasCaja();
    });
  }

  loadDiferenciasMaletin() {
    this.isLoadingMaletin = true;
    this.loadingMaletinSubject.next(true);
    
    const minLoadingTime = 300;
    const startTime = Date.now();
    
    const filters = this.diferenciaMaletinFilters.value;
    const estadoFiltrado = filters.estadoDiferencia !== 'TODAS' ? filters.estadoDiferencia : null;

    const estadosBackend: string[] = Object.values(PdvCajaEstado);
    const estadoBackend: PdvCajaEstado | null =
      estadoFiltrado && estadosBackend.includes(estadoFiltrado) ? (estadoFiltrado as PdvCajaEstado) : null;
    const filtrarDiferenciaFront = 
      estadoFiltrado === 'CON_DIFERENCIA' || estadoFiltrado === 'SIN_DIFERENCIA';

    const cajaAnteriorId = filters.cajaAnteriorId && filters.cajaAnteriorId.toString().trim() !== '' 
      ? parseInt(filters.cajaAnteriorId) : null;
    const maletinDescripcion = filters.maletinDescripcion && filters.maletinDescripcion.trim() !== '' 
      ? filters.maletinDescripcion.trim() : null;
    const sucursalId = filters.sucursalId && filters.sucursalId.toString().trim() !== '' 
      ? parseInt(filters.sucursalId) : null;

    const hayFiltrosDeId = cajaAnteriorId || maletinDescripcion;
    const hayOtrosFiltros = sucursalId || estadoFiltrado;
    const hayFiltrosEspecificos = hayFiltrosDeId || hayOtrosFiltros;

    let fechaInicio: Date = null;
    let fechaFin: Date = null;

    if (filters.fechaCierre) {
      const fechaSeleccionada = new Date(filters.fechaCierre);
      
      fechaInicio = new Date(
        fechaSeleccionada.getFullYear(),
        fechaSeleccionada.getMonth(),
        fechaSeleccionada.getDate(),
        0, 0, 0, 0
      );

      fechaFin = new Date(
        fechaSeleccionada.getFullYear(),
        fechaSeleccionada.getMonth(),
        fechaSeleccionada.getDate(),
        23, 59, 59, 999
      );
    } else {
      const hayFiltrosDeIdUnicos = cajaAnteriorId || maletinDescripcion;
      if (!hayFiltrosDeIdUnicos) {
        const fechaDefecto = new Date();
        fechaDefecto.setDate(fechaDefecto.getDate() - 120);
        
        fechaInicio = new Date(fechaDefecto);
        fechaInicio.setHours(0, 0, 0, 0);
  
        fechaFin = new Date();
        fechaFin.setHours(23, 59, 59, 999);

        if (!this.tieneOtrosFiltros()) {
          this.diferenciaMaletinFilters.patchValue({ fechaCierre: new Date() }, { emitEvent: false });
        }
      }
    }
    
    const params = {
      cajaAnteriorId,
      maletinDescripcion,
      sucursalId,
      fechaInicio,
      fechaFin,
      page: this.pageIndexMaletin,
      size: this.pageSizeMaletin
    };

    this.cajaService.onGetCajasAnalisisDiferencias(
      null,
      params.cajaAnteriorId,
      estadoBackend,
      null, 
      params.maletinDescripcion,
      null,
      params.fechaInicio,
      params.fechaFin,
      params.sucursalId,
      null,  
      params.page,
      params.size,
      filtrarDiferenciaFront ? estadoFiltrado : null
    ).pipe(untilDestroyed(this)).subscribe((response: any) => {
      
      const responseData = response?.data || response;
      
      this.selectedPageInfo = responseData as PageInfo<PdvCaja>;
      const rawData = (this.selectedPageInfo?.getContent as any[]) || [];

      const dataAugmented: DataRow[] = rawData.map(c => ({ 
        ...(c as any),
        estadoDiferencia: c.estadoDiferenciaConsecutiva
      }));

      this.diferenciaMaletinDataSource.data = dataAugmented;
      this.totalElementsMaletin = this.selectedPageInfo?.getTotalElements || 0;
      
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        this.isLoadingMaletin = false;
        this.loadingMaletinSubject.next(false);
      }, remainingTime);
      
    }, (error: any) => {
      console.error('Error en la petición:', error);
      
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        this.isLoadingMaletin = false;
        this.loadingMaletinSubject.next(false);
      }, remainingTime);
    });
  }

  handlePageEventMaletin(event: PageEvent) {
    this.pageIndexMaletin = event.pageIndex;
    this.pageSizeMaletin = event.pageSize;
    this.loadDiferenciasMaletin();
  }

  limpiarFiltros() {
    const fechaInicial = new Date();
    fechaInicial.setDate(fechaInicial.getDate() - 1);
    
    this.pageIndexMaletin = 0;
    
    this.diferenciaMaletinFilters.patchValue({
      fechaCierre: fechaInicial,
      maletinDescripcion: null,
      cajaAnteriorId: null,
      estadoDiferencia: 'TODAS',
      sucursalId: null
    }, { emitEvent: false });
    
    this.loadDiferenciasMaletin();
  }

  filtrarGlobal() {
    const cajaId = this.globalCajaFilter.value;
    
    if (cajaId) {
      this.isLoadingGlobal = true;
      
      this.diferenciaMaletinFilters.patchValue({
        fechaCierre: null,
        cajaAnteriorId: cajaId
      }, { emitEvent: false });
      
      this.diferenciaCajaFilters.patchValue({
        fechaApertura: null,
        cajaAnteriorId: cajaId
      }, { emitEvent: false });
      
      this.bothTablesLoaded$.subscribe(([maletin, caja]) => {
        if (!maletin && !caja && this.isLoadingGlobal) {
          this.isLoadingGlobal = false;
        }
      });
      
      this.pageIndexMaletin = 0;
      this.pageIndexCaja = 0;
      
      this.loadDiferenciasMaletin();
      this.loadDiferenciasCaja();
    }
  }

  limpiarFiltrosGlobal() {
    this.globalCajaFilter.setValue('');
    
    const fechaInicial = new Date();
    fechaInicial.setDate(fechaInicial.getDate() - 1);
    
    this.pageIndexMaletin = 0;
    this.pageIndexCaja = 0;
    
    this.diferenciaMaletinFilters.patchValue({
      fechaCierre: fechaInicial,
      maletinDescripcion: null,
      cajaAnteriorId: null,
      estadoDiferencia: 'TODAS',
      sucursalId: null
    }, { emitEvent: false });
    
    this.diferenciaCajaFilters.patchValue({
      fechaApertura: fechaInicial,
      sucursalId: null,
      maletinId: null,
      maletinDescripcion: '',
      cajaAnteriorId: null,
      estadoDiferencia: 'TODAS'
    }, { emitEvent: false });
    
    this.loadDiferenciasMaletin();
    this.loadDiferenciasCaja();
  }

  onGoToCaja(cajaId: number, tipo: 'apertura' | 'cierre') {
    if (!cajaId) return;
  
    let cajaEncontrada = null;
    
    if (tipo === 'cierre') {
      cajaEncontrada = this.diferenciaMaletinDataSource.data.find(c => c.cajaAnteriorId === cajaId) ||
                      this.diferenciaCajaDataSource.data.find(c => c.cajaAnteriorId === cajaId);
      
      if (cajaEncontrada) {
        const cajaAnterior = {
          id: cajaEncontrada.cajaAnteriorId,
          sucursalId: cajaEncontrada.sucursalId,
          sucursal: cajaEncontrada.sucursal
        };
        this.tabService.addTab(
          new Tab(
            AdicionarCajaDialogComponent,
            "Cierre de caja " + cajaEncontrada.cajaAnteriorId,
            new TabData(cajaEncontrada.cajaAnteriorId, cajaAnterior, "cierre")
          )
        );
      } else {
        this.openFallbackTab(cajaId);
      }
    } else {
      cajaEncontrada = this.diferenciaMaletinDataSource.data.find(c => c.id === cajaId) ||
                      this.diferenciaCajaDataSource.data.find(c => c.id === cajaId);
      
      if (cajaEncontrada) {
        this.tabService.addTab(
          new Tab(
            AdicionarCajaDialogComponent,
            "Apertura de caja " + cajaEncontrada.id,
            new TabData(cajaEncontrada.id, cajaEncontrada, "apertura")
          )
        );
      } else {
        this.openFallbackTab(cajaId);
      }
    }
  }

  openFallbackTab(cajaId: number) {
    const primerItemMaletin = this.diferenciaMaletinDataSource.data[0];
    const primerItemCaja = this.diferenciaCajaDataSource.data[0];
    const primerItem = primerItemMaletin || primerItemCaja;    
    const fallbackData = primerItem ? {
      id: cajaId,
      sucursalId: primerItem.sucursalId,
      sucursal: primerItem.sucursal
    } : { id: cajaId };

    this.tabService.addTab(
      new Tab(
        AdicionarCajaDialogComponent,
        "Conteo de caja " + cajaId,
        new TabData(cajaId, fallbackData)
      )
    );
  }

  tieneOtrosFiltros() {
    const filters = this.diferenciaMaletinFilters.value;
    const cajaAnteriorId = filters.cajaAnteriorId && filters.cajaAnteriorId.toString().trim() !== '';
    const maletinDescripcion = filters.maletinDescripcion && filters.maletinDescripcion.toString().trim() !== '';
    const sucursalId = filters.sucursalId && filters.sucursalId.toString().trim() !== '';
    const estadoDiferencia = filters.estadoDiferencia && filters.estadoDiferencia !== 'TODAS';
    
    return cajaAnteriorId || maletinDescripcion || sucursalId || estadoDiferencia;
  }

  getOrdenamientoActual() {
    const filters = this.diferenciaMaletinFilters.value;
    const tieneFecha = !!filters.fechaCierre;
    const tieneOtrosFiltros = this.tieneOtrosFiltros();
    
    if (tieneOtrosFiltros && !tieneFecha) {
      return 'Por fecha descendente (más recientes primero)';
    } else if (tieneFecha || !tieneOtrosFiltros) {
      return 'Por maletín y fecha (optimizado para comparaciones consecutivas)';
    }
    return 'Estándar';
  }

  onMaletinSearch() {
    const sucId = this.diferenciaMaletinFilters.value.sucursalId;

    let data: SearchListtDialogData = {
      titulo: "Buscar maletín",
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        { id: "descripcion", nombre: "Descripción", width: "50%" },
        { id: "abierto", nombre: "Abierto", width: "40%" },
      ],
      query: this.searchMaletinGQL,
      queryData: {
        sucId: sucId,
        texto: null
      },
      inicialSearch: true,
    };

    this.matDialog.open(SearchListDialogComponent, {
      data: data,
      height: '80vh',
      width: '70vw',
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((res: Maletin) => {
      if (res != null) {
        this.onSelectMaletin(res);
      }
    });
  }

  onSelectMaletin(maletin: Maletin) {
    this.diferenciaMaletinFilters.patchValue({
      maletinDescripcion: maletin?.descripcion
    });
  }

  clearMaletinFilter() {
    this.diferenciaMaletinFilters.patchValue({
      maletinDescripcion: null
    });
  }

  onMaletinSearchCaja() {
    const sucId = this.diferenciaCajaFilters.value.sucursalId;

    let data: SearchListtDialogData = {
      titulo: "Buscar maletín",
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        { id: "descripcion", nombre: "Descripción", width: "50%" },
        { id: "abierto", nombre: "Abierto", width: "40%" },
      ],
      query: this.searchMaletinGQL,
      queryData: {
        sucId: sucId,
        texto: null
      },
      inicialSearch: true,
    };

    this.matDialog.open(SearchListDialogComponent, {
      data: data,
      height: '80vh',
      width: '70vw',
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((res: Maletin) => {
      if (res != null) {
        this.onSelectMaletinCaja(res);
      }
    });
  }

  onSelectMaletinCaja(maletin: Maletin) {
    this.diferenciaCajaFilters.patchValue({
      maletinDescripcion: maletin?.descripcion,
      maletinId: maletin?.id
    });
  }

  clearMaletinFilterCaja() {
    this.diferenciaCajaFilters.patchValue({
      maletinDescripcion: null,
      maletinId: null
    });
  }

  onClickRow(element: DataRow, index: number) {
    
    const isSecondTable = this.diferenciaCajaDataSource.data.includes(element);
    
    if (isSecondTable) {
      this.loadCajaBalanceReal(element);
    } else {
      this.loadCajaBalance(element);
      this.loadCajaAnteriorData(element);
      this.calculateMontos(element);
    }
  }

  onClickRowMaletin(element: DataRow, index: number) {
    this.expandedElementMaletin = this.expandedElementMaletin === element ? null : element;
    this.onClickRow(element, index);
  }

  onClickRowCaja(element: DataRow, index: number) {
    this.expandedElementCaja = this.expandedElementCaja === element ? null : element;
    this.onClickRow(element, index);
  }

  loadCajaBalance(item: DataRow) {
    if (!item.id || !item.sucursal?.id) {
      console.warn('No se puede cargar balance de caja - faltan datos:', {
        cajaId: item.id,
        sucursalId: item.sucursal?.id
      });
      return;
    }

    this.cajaService.onCajaBalancePorIdAndSucursalId(item.id, item.sucursal.id, true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (balance) => {
          if (balance) {
            item.balance = balance;
          } else {
            console.warn('No se encontró balance para la caja:', item.id);
          }
        },
        error: (error) => {
          console.error('Error al cargar balance de caja:', error);
        }
      });
  }

  loadCajaAnteriorData(item: DataRow) {
    if (!item.cajaAnteriorId || !item.sucursal?.id) {
      console.warn('No se puede cargar datos de caja anterior - faltan datos:', {
        cajaAnteriorId: item.cajaAnteriorId,
        sucursalId: item.sucursal?.id
      });
      return;
    }

    this.cajaService.onGetByIdSimp(item.cajaAnteriorId, item.sucursal.id, true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (cajaAnterior) => {
          if (cajaAnterior) {
            item.cajaAnteriorData = cajaAnterior;
            this.calculateMontos(item);
          } else {
            console.warn('No se encontraron datos para la caja anterior:', item.cajaAnteriorId);
          }
        },
        error: (error) => {
          console.error('Error al cargar datos de caja anterior:', error);
        }
      });
  }

  calculateMontos(item: DataRow) {
    const aperturaMontos = this.calculateTotalesByConteo(item.conteoApertura);
    const cierreMontos = this.calculateTotalesByConteo(item.cajaAnteriorData?.conteoCierre);

    item.montosCalculados = {
      apertura: aperturaMontos,
      cierre: cierreMontos
    };
  }

  calculateTotalesByConteo(conteo: any) {
    const totales = { gs: 0, rs: 0, ds: 0 };
    
    if (!conteo) {
      return totales;
    }

    if (conteo.conteoMonedaList && conteo.conteoMonedaList.length > 0) {
      conteo.conteoMonedaList.forEach((conteoMoneda: any) => {
        const denominacion = conteoMoneda.monedaBilletes?.moneda?.denominacion;
        const cantidad = conteoMoneda.cantidad || 0;
        const valor = conteoMoneda.monedaBilletes?.valor || 0;
        const total = cantidad * valor;
        
        switch (denominacion) {
          case 'GUARANI':
            totales.gs += total;
            break;
          case 'REAL':
            totales.rs += total;
            break;
          case 'DOLAR':
            totales.ds += total;
            break;
        }
      });
      return totales;
    }

    if (conteo.totalGs != null || conteo.totalRs != null || conteo.totalDs != null) {
      totales.gs = conteo.totalGs || 0;
      totales.rs = conteo.totalRs || 0;
      totales.ds = conteo.totalDs || 0;
      return totales;
    }
    
    console.warn('No se encontraron datos para calcular totales en conteo ID:', conteo?.id);
    return totales;
  }

  loadDiferenciasCaja() {
    this.isLoadingCaja = true;
    this.loadingCajaSubject.next(true);
    
    const minLoadingTime = 300;
    const startTime = Date.now();
    
    const filters = this.diferenciaCajaFilters.value;

    let fechaInicio: Date = null;
    let fechaFin: Date = null;
    
    if (filters.fechaApertura) {
      const fechaSeleccionada = new Date(filters.fechaApertura);
      
      fechaInicio = new Date(
        fechaSeleccionada.getFullYear(),
        fechaSeleccionada.getMonth(),
        fechaSeleccionada.getDate(),
        0, 0, 0, 0
      );

      fechaFin = new Date(
        fechaSeleccionada.getFullYear(),
        fechaSeleccionada.getMonth(),
        fechaSeleccionada.getDate(),
        23, 59, 59, 999
      );
    }

    let maletinId: number = null;
    if (filters.maletinId) {
      maletinId = filters.maletinId;
    }

    let cajaAnteriorId: number = null;
    if (filters.cajaAnteriorId && filters.cajaAnteriorId.toString().trim() !== '') {
      cajaAnteriorId = parseInt(filters.cajaAnteriorId.toString());
    }

    const params = {
      fechaInicio,
      fechaFin,
      maletinId,
      cajaAnteriorId,
      sucursalId: filters.sucursalId || null,
      estadoDiferencia: filters.estadoDiferencia || 'TODAS'
    };


    this.cajaService.onGetCajasAnalisisDiferencias(
      null, 
      cajaAnteriorId, 
      null, 
      maletinId, 
      null, 
      null, 
      fechaInicio, 
      fechaFin, 
      params.sucursalId, 
      null, 
      this.pageIndexCaja, 
      this.pageSizeCaja, 
      null 
    ).pipe(untilDestroyed(this)).subscribe((response: any) => {
      
      const responseData = response?.data || response;
      
      this.selectedPageInfoCaja = responseData as PageInfo<PdvCaja>;
      const rawData = (this.selectedPageInfoCaja?.getContent as any[]) || [];

      let filteredByDate = rawData;

      const dataAugmented: DataRow[] = filteredByDate.map(c => {
        return {
          ...(c as any),
          estadoDiferencia: 'SIN_DATOS'
        };
      });

      this.cargarBalancesYCalcularEstados(dataAugmented, params.estadoDiferencia, startTime, minLoadingTime);
      
    }, (error: any) => {
      console.error(' Error en la petición de diferencias de caja:', error);
      
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        this.isLoadingCaja = false;
        this.loadingCajaSubject.next(false);
      }, remainingTime);
    });
  }

  cargarBalancesYCalcularEstados(dataAugmented: DataRow[], estadoFiltro: string, startTime?: number, minLoadingTime?: number) {
    
    let cajasProcesadas = 0;
    const totalCajas = dataAugmented.length;
    
    if (totalCajas === 0) {
      this.diferenciaCajaDataSource.data = [];
      this.totalElementsCaja = 0;
      
      if (startTime && minLoadingTime) {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        setTimeout(() => {
          this.isLoadingCaja = false;
          this.loadingCajaSubject.next(false);
        }, remainingTime);
      } else {
        this.isLoadingCaja = false;
        this.loadingCajaSubject.next(false);
      }
      return;
    }

    dataAugmented.forEach((item, index) => {
      const cajaIdParaBalance = item.cajaAnteriorId || item.id;
      
      if (!cajaIdParaBalance || !item.sucursal?.id) {
        console.warn('No se puede cargar balance para caja - faltan datos:', {
          cajaId: cajaIdParaBalance,
          sucursalId: item.sucursal?.id
        });
        cajasProcesadas++;
        this.verificarCompletado();
        return;
      }

      this.cajaService.onCajaBalancePorIdAndSucursalId(cajaIdParaBalance, item.sucursal.id, true)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (balance) => {
            if (balance) {
              
              item.balance = balance;
              
              const diferenciaGs = balance.diferenciaGs || 0;
              const diferenciaRs = balance.diferenciaRs || 0;
              const diferenciaDs = balance.diferenciaDs || 0;
              
              item.estadoDiferencia = this.calcularEstadoDiferencia(diferenciaGs, diferenciaRs, diferenciaDs);
              
            } else {
              console.warn('No se encontró balance para la caja:', cajaIdParaBalance);
              item.estadoDiferencia = 'SIN_DATOS';
            }
            
            cajasProcesadas++;
            this.verificarCompletado();
          },
          error: (error) => {
            console.error('Error al cargar balance de caja:', error);
            item.estadoDiferencia = 'SIN_DATOS';
            cajasProcesadas++;
            this.verificarCompletado();
          }
        });
    });

    const verificarCompletado = () => {
      if (cajasProcesadas === totalCajas) {
        
        let filteredData = dataAugmented;
        if (estadoFiltro && estadoFiltro !== 'TODAS') {
          filteredData = dataAugmented.filter(item => item.estadoDiferencia === estadoFiltro);
        }

        this.diferenciaCajaDataSource.data = filteredData;
        this.totalElementsCaja = this.selectedPageInfoCaja?.getTotalElements || filteredData.length;
        
        if (startTime && minLoadingTime) {
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
          
          setTimeout(() => {
            this.isLoadingCaja = false;
            this.loadingCajaSubject.next(false);
          }, remainingTime);
        } else {
          this.isLoadingCaja = false;
          this.loadingCajaSubject.next(false);
        }
      }
    };

    this.verificarCompletado = verificarCompletado;
  }

  tieneDiferenciaEnCaja(caja: any) {
    if (!caja.balance) {
      return false;
    }
    
    const diferenciaGs = caja.balance.diferenciaGs || 0;
    const diferenciaRs = caja.balance.diferenciaRs || 0;
    const diferenciaDs = caja.balance.diferenciaDs || 0;
    
    const tieneDiferencia = diferenciaGs !== 0 || diferenciaRs !== 0 || diferenciaDs !== 0;
    
    return tieneDiferencia;
  }

  loadCajaBalanceReal(item: DataRow) {

    const cajaIdParaBalance = item.cajaAnteriorId || item.id;
    
    if (!cajaIdParaBalance || !item.sucursal?.id) {
      console.warn('No se puede cargar balance real de caja - faltan datos:', {
        cajaId: cajaIdParaBalance,
        sucursalId: item.sucursal?.id
      });
      return;
    }

    this.cajaService.onCajaBalancePorIdAndSucursalId(cajaIdParaBalance, item.sucursal.id, true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (balance) => {
          if (balance) {
            item.balance = balance;
            
            const diferenciaGs = balance.diferenciaGs || 0;
            const diferenciaRs = balance.diferenciaRs || 0;
            const diferenciaDs = balance.diferenciaDs || 0;
            
            item.estadoDiferencia = this.calcularEstadoDiferencia(diferenciaGs, diferenciaRs, diferenciaDs);
            
          } else {
            console.warn('No se encontró balance para la caja:', cajaIdParaBalance);
            item.estadoDiferencia = 'SIN_DATOS';
          }
        },
        error: (error) => {
          console.error('Error al cargar balance de caja:', error);
          item.estadoDiferencia = 'SIN_DATOS';
        }
      });
  }

  async calculateTotalesFromVentas(cajaId: number, sucursalId: number) {
    return new Promise((resolve) => {
      this.ventaService.onSearch(
        null, 
        cajaId, 
        0, 
        1000, 
        true, 
        sucursalId, 
        null, 
        null,
        null, 
        null, 
        null
      ).pipe(untilDestroyed(this)).subscribe((response) => {
        if (response && response.getContent) {
          const ventas: Venta[] = response.getContent;

          const ventasCompletas: Venta[] = [];
          let ventasProcesadas = 0;

          if (ventas.length === 0) {
            resolve({
              totalRecibidoGs: 0,
              totalRecibidoRs: 0,
              totalRecibidoDs: 0,
              totalTarjeta: 0,
              totalCredito: 0,
              totalFinal: 0,
              diferenciaGs: 0,
              diferenciaRs: 0,
              diferenciaDs: 0
            });
            return;
          }

          ventas.forEach((venta, index) => {
            this.ventaService.onGetPorId(venta.id, venta.sucursalId, true)
              .pipe(untilDestroyed(this))
              .subscribe((ventaCompleta) => {
                if (ventaCompleta) {
                  ventasCompletas.push(ventaCompleta);
                }
                ventasProcesadas++;

                if (ventasProcesadas === ventas.length) {
                  this.calcularTotalesDeVentas(ventasCompletas, cajaId, resolve);
                }
              });
          });
        } else {
          console.warn(`No se encontraron ventas para la caja ${cajaId}`);
          resolve(null);
        }
      });
    });
  }

  private calcularTotalesDeVentas(ventas: Venta[], cajaId: number, resolve: Function) {
    let totalRecibidoGs = 0;
    let totalRecibidoRs = 0;
    let totalRecibidoDs = 0;
    let totalRecibido = 0;
    let totalTarjeta = 0;
    let totalCredito = 0;
    let totalFinal = 0;

    ventas.forEach((venta, index) => {

      if (venta.cobro && venta.cobro.cobroDetalleList) {
        venta.cobro.cobroDetalleList.forEach((cobroDetalle) => {

          if (cobroDetalle.moneda.denominacion === "GUARANI") {
            if (cobroDetalle.pago || cobroDetalle.vuelto) {
              totalRecibidoGs += cobroDetalle.valor;
              totalRecibido += cobroDetalle.valor;
              totalFinal += cobroDetalle.valor;
            } else if (cobroDetalle.aumento) {
            } else if (cobroDetalle.descuento) {
            }
          } else if (cobroDetalle.moneda.denominacion === "REAL") {
            if (cobroDetalle.pago || cobroDetalle.vuelto) {
              totalRecibidoRs += cobroDetalle.valor;
              totalRecibido += cobroDetalle.valor * cobroDetalle.cambio;
              totalFinal += cobroDetalle.valor * cobroDetalle.cambio;
            }
          } else if (cobroDetalle.moneda.denominacion === "DOLAR") {
            if (cobroDetalle.pago || cobroDetalle.vuelto) {
              totalRecibidoDs += cobroDetalle.valor;
              totalRecibido += cobroDetalle.valor * cobroDetalle.cambio;
              totalFinal += cobroDetalle.valor * cobroDetalle.cambio;
            }
          }
          
          if (cobroDetalle.formaPago) {
            if (cobroDetalle.formaPago.descripcion.toLowerCase().includes('tarjeta')) {
              totalTarjeta += cobroDetalle.valor * cobroDetalle.cambio;
            } else if (cobroDetalle.formaPago.descripcion.toLowerCase().includes('crédito') || 
                     cobroDetalle.formaPago.descripcion.toLowerCase().includes('credito')) {
              totalCredito += cobroDetalle.valor * cobroDetalle.cambio;
            }
          }
        });
      }
    });

    resolve({
      totalRecibidoGs,
      totalRecibidoRs,
      totalRecibidoDs,
      totalTarjeta,
      totalCredito,
      totalFinal,
      diferenciaGs: 0,
      diferenciaRs: 0,
      diferenciaDs: 0 
    });
  }

  handlePageEventCaja(event: PageEvent) {
    this.pageIndexCaja = event.pageIndex;
    this.pageSizeCaja = event.pageSize;
    this.loadDiferenciasCaja();
  }

  tieneOtrosFiltrosCaja() {
    const filters = this.diferenciaCajaFilters.value;
    const cajaAnteriorId = filters.cajaAnteriorId && filters.cajaAnteriorId.toString().trim() !== '';
    const maletinDescripcion = filters.maletinDescripcion && filters.maletinDescripcion.toString().trim() !== '';
    const sucursalId = filters.sucursalId && filters.sucursalId.toString().trim() !== '';
    const estadoDiferencia = filters.estadoDiferencia && filters.estadoDiferencia !== 'TODAS';
    
    return cajaAnteriorId || maletinDescripcion || sucursalId || estadoDiferencia;
  }

}