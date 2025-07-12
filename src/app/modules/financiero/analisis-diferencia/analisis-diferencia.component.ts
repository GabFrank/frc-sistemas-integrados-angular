import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { PageInfo } from '../../../app.component';
import { MatTableDataSource } from '@angular/material/table';
import { PdvCaja, PdvCajaEstado } from '../pdv/caja/caja.model';
import { trigger, state, style, transition, animate } from '@angular/animations';

type DataRow = Omit<PdvCaja, 'toInput'> & { 
  estadoDiferencia?: string; 
  cajaAnteriorId?: number; 
  cajaAnteriorData?: PdvCaja; 
  montosCalculados?: {
    apertura: { gs: number, rs: number, ds: number },
    cierre: { gs: number, rs: number, ds: number }
  }
};
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

@UntilDestroy()
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

  // Table 1 (Diferencia de maletín)
  diferenciaMaletinColumns: string[] = ['cierre', 'sucursal', 'maletin', 'cierreCaja', 'aperturaCaja', 'estado'];
  diferenciaMaletinDataSource = new MatTableDataSource<DataRow>([]);
  diferenciaMaletinFilters: FormGroup;
  totalElementsMaletin: number = 0;
  selectedPageInfo: PageInfo<PdvCaja>;
  pageIndexMaletin: number = 0;
  pageSizeMaletin: number = 10;
  expandedElement: DataRow | null = null;

  // Sucursal list for selectors
  sucursalList: Sucursal[] = [];

  constructor(
    private fb: FormBuilder,
    private cajaService: CajaService,
    private sucursalService: SucursalService,
    private router: Router,
    private tabService: TabService,
    private matDialog: MatDialog,
    private searchMaletinGQL: SearchMaletinGQL
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadSucursales();
    this.loadDiferenciasMaletin();
    this.subscribeToFilterChanges();
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
  }

  loadSucursales(): void {
    this.sucursalService.onGetAllSucursales(true, true).subscribe(res => {
      this.sucursalList = res?.filter(sucursal => 
        sucursal.nombre != "SERVIDOR" && sucursal.nombre != "COMPRAS");
      
    })
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
  }

  loadDiferenciasMaletin(): void {
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
      fechaInicio = new Date(filters.fechaCierre);
      fechaInicio.setHours(0, 0, 0, 0);

      fechaFin = new Date(filters.fechaCierre);
      fechaFin.setHours(23, 59, 59, 999);
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
      null, // cajaId
      params.cajaAnteriorId,
      estadoBackend,
      null, // maletinId
      params.maletinDescripcion,
      null, // cajeroId
      params.fechaInicio,
      params.fechaFin,
      params.sucursalId,
      null, // verificado
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
      
    }, (error: any) => {
      console.error('Error en la petición:', error);
    });
  }

  handlePageEventMaletin(event: PageEvent): void {
    this.pageIndexMaletin = event.pageIndex;
    this.pageSizeMaletin = event.pageSize;
    this.loadDiferenciasMaletin();
  }

  limpiarFiltros(): void {
    const fechaInicial = new Date();
    fechaInicial.setDate(fechaInicial.getDate() - 1);
    
    this.diferenciaMaletinFilters.reset({
      fechaCierre: fechaInicial,
      maletinDescripcion: null,
      cajaAnteriorId: null,
      estadoDiferencia: 'TODAS',
      sucursalId: null
    });
    this.pageIndexMaletin = 0;
    this.loadDiferenciasMaletin();
  }

  onGoToCaja(cajaId: number, tipo: 'apertura' | 'cierre'): void {
    if (!cajaId) return;
  
    if (tipo === 'cierre') {
      const cajaConCierre = this.diferenciaMaletinDataSource.data.find(c => c.cajaAnteriorId === cajaId);
      if (cajaConCierre) {
        const cajaAnterior = {
          id: cajaConCierre.cajaAnteriorId,
          sucursalId: cajaConCierre.sucursalId,
          sucursal: cajaConCierre.sucursal
        };
        this.tabService.addTab(
          new Tab(
            AdicionarCajaDialogComponent,
            "Cierre de caja " + cajaConCierre.cajaAnteriorId,
            new TabData(cajaConCierre.cajaAnteriorId, cajaAnterior, "cierre")
          )
        );
      } else {
        this.openFallbackTab(cajaId);
      }
    } else {
      const cajaApertura = this.diferenciaMaletinDataSource.data.find(c => c.id === cajaId);
      if (cajaApertura) {
        this.tabService.addTab(
          new Tab(
            AdicionarCajaDialogComponent,
            "Apertura de caja " + cajaApertura.id,
            new TabData(cajaApertura.id, cajaApertura, "apertura")
          )
        );
      } else {
        this.openFallbackTab(cajaId);
      }
    }
  }

  openFallbackTab(cajaId: number): void {
    console.warn('Caja no encontrada en los datos actuales. Abriendo pestaña de fallback. ID:', cajaId);
    
    const primerItem = this.diferenciaMaletinDataSource.data[0];
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

  tieneOtrosFiltros(): boolean {
    const filters = this.diferenciaMaletinFilters.value;
    const cajaAnteriorId = filters.cajaAnteriorId && filters.cajaAnteriorId.toString().trim() !== '';
    const maletinDescripcion = filters.maletinDescripcion && filters.maletinDescripcion.toString().trim() !== '';
    const sucursalId = filters.sucursalId && filters.sucursalId.toString().trim() !== '';
    const estadoDiferencia = filters.estadoDiferencia && filters.estadoDiferencia !== 'TODAS';
    
    return cajaAnteriorId || maletinDescripcion || sucursalId || estadoDiferencia;
  }

  getOrdenamientoActual(): string {
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

  onMaletinSearch(): void {
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

  onSelectMaletin(maletin: Maletin): void {
    this.diferenciaMaletinFilters.patchValue({
      maletinDescripcion: maletin?.descripcion
    });
  }

  clearMaletinFilter(): void {
    this.diferenciaMaletinFilters.patchValue({
      maletinDescripcion: null
    });
  }

  onClickRow(element: DataRow, index: number): void {
    if (this.expandedElement === element) {

      if (!element.montosCalculados) {
        const aperturaMontos = this.calculateTotalesByConteo(element.conteoApertura);
        element.montosCalculados = {
          apertura: aperturaMontos,
          cierre: { gs: 0, rs: 0, ds: 0 }
        };
      }
      
      if (element.cajaAnteriorId && !element.cajaAnteriorData) {
        this.loadCajaAnteriorData(element);
      }
    }
  }

  loadCajaAnteriorData(item: DataRow): void {
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

  calculateMontos(item: DataRow): void {
    const aperturaMontos = this.calculateTotalesByConteo(item.conteoApertura);
    const cierreMontos = this.calculateTotalesByConteo(item.cajaAnteriorData?.conteoCierre);

    item.montosCalculados = {
      apertura: aperturaMontos,
      cierre: cierreMontos
    };
  }

  calculateTotalesByConteo(conteo: any): { gs: number, rs: number, ds: number } {
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



  // Table 2 (placeholder)
  detalle2DataSource = new MatTableDataSource<any>([]);
  detalle2Columns: string[] = ['fechaApertura', 'sucursal', 'maletin', 'cajaNro', 'estado'];
}
