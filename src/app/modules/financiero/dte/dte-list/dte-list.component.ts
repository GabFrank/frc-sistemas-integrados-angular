import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { DteService, DocumentoElectronicoDto, PageInfo } from "../dte.service";
import { PageEvent } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { EventoDteDialogComponent } from "../evento-dte-dialog/evento-dte-dialog.component";
import { EventosDteViewDialogComponent } from "../eventos-dte-view-dialog/eventos-dte-view-dialog.component";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { DteRechazadosRecientesGQL } from "../graphql/dteRechazadosRecientes";
import { SelectionModel } from "@angular/cdk/collections";

interface DocumentoElectronicoView extends DocumentoElectronicoDto {
  xmlActionText?: string;
  estadoDesc?: string;
}

interface DteMetricsView {
  total: number;
  pendientes: number;
  generados: number;
  enviados: number;
  aprobados: number;
  rechazados: number;
  cancelados: number;
}

const ESTADO_DESC: { [k: string]: string } = {
  PENDIENTE: 'Pendiente',
  GENERADO: 'Generado',
  ENVIADO: 'Enviado',
  RECIBIDO_POR_SIFEN: 'Recibido por SIFEN',
  PROCESADO_OK: 'Procesado OK',
  PROCESADO_ERROR: 'Procesado con error',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  CANCELADO: 'Cancelado',
};

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-dte-list",
  templateUrl: "./dte-list.component.html",
  styleUrls: ["./dte-list.component.scss"],
})
export class DteListComponent implements OnInit {
  dataSource = new MatTableDataSource<DocumentoElectronicoView>([]);
  displayedColumns = ["select","id", "cdc", "estadoSifen", "creadoEn", "menu"];

  sucursalList: Sucursal[] = [];
  selection = new SelectionModel<any>(true, []);

  pageIndex = 0;
  pageSize = 15;
  selectedPageInfo: PageInfo<DocumentoElectronicoView>;

  estadoControl = new FormControl();
  fechaInicioControl = new FormControl();
  fechaFinalControl = new FormControl();
  cdcControl = new FormControl<string | null>(null);
  sucursalIdControl = new FormControl<number | null>(null);
  fechaFormGroup: FormGroup;
  filtroForm: FormGroup;

  metrics: DteMetricsView;
  rechazadosRecientes: DocumentoElectronicoView[] = [];

  constructor(private dteService: DteService, private dialog: MatDialog, private sucursalService: SucursalService, private dteRechazadosGQL: DteRechazadosRecientesGQL) {}

  ngOnInit(): void {
    const hoy = new Date();
    const desde = new Date();
    desde.setDate(hoy.getDate() - 7);

    this.fechaInicioControl.setValue(desde);
    this.fechaFinalControl.setValue(hoy);

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinalControl,
    });

    this.filtroForm = new FormGroup({
      estado: this.estadoControl,
      cdc: this.cdcControl,
      sucursalId: this.sucursalIdControl,
    });
    this.buscar();
    this.cargarMetrics();
    this.loadSucursales();
    this.cargarRechazadosRecientes();
  }

  loadSucursales() {
    this.sucursalService.onGetAllSucursales(true, true).pipe(untilDestroyed(this)).subscribe((res) => {
      this.sucursalList = res?.filter(sucursal => 
        sucursal.nombre != "SERVIDOR" && sucursal.nombre != "COMPRAS") || [];
    });
  }

  cargarMetrics() {
    this.dteService.metrics()
      .pipe(untilDestroyed(this))
      .subscribe((m: any) => {
        this.metrics = m as DteMetricsView;
      });
  }

  cargarRechazadosRecientes() {
    this.dteRechazadosGQL.fetch({ limit: 5 }).pipe(untilDestroyed(this)).subscribe((res: any) => {
      this.rechazadosRecientes = (res?.data?.data || []) as any;
    });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  onPage(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.buscar();
  }

  private computeXmlActionText(estado: string | null | undefined): string {
    return estado === 'GENERADO' || estado === 'APROBADO' ? 'Descargar XML' : 'Generar XML';
  }

  private mapToView(data: DocumentoElectronicoDto[]): DocumentoElectronicoView[] {
    return (data || []).map(d => ({
      ...d,
      xmlActionText: this.computeXmlActionText(d?.estadoSifen),
      estadoDesc: ESTADO_DESC[d?.estadoSifen] || d?.estadoSifen
    }));
  }

  buscar() {
    const estado = this.estadoControl.value;
    const fechaDesde = this.fechaFormGroup.get('inicio').value;
    const fechaHasta = this.fechaFormGroup.get('fin').value;
    const cdc = (this.cdcControl.value || undefined) as string | undefined;
    const sucursalId = (this.sucursalIdControl.value || undefined) as number | undefined;
    
    const fechaDesdeDate = fechaDesde instanceof Date ? fechaDesde : new Date(fechaDesde);
    const fechaHastaDate = fechaHasta instanceof Date ? fechaHasta : new Date(fechaHasta);
    
    this.dteService
      .listar(this.pageIndex, this.pageSize, estado, fechaDesdeDate, fechaHastaDate, true, cdc, sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.selectedPageInfo = {
            ...res,
            getContent: this.mapToView(res.getContent as any)
          } as any;
          this.dataSource.data = this.selectedPageInfo.getContent as any;
        }
      });
  }

  generar(ventaId: number, sucursalId: number) {
    this.dteService
      .generar(ventaId, sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe(() => { this.buscar(); this.cargarMetrics(); });
  }

  enviarLote() {
    this.dteService
      .enviarLoteNow()
      .pipe(untilDestroyed(this))
      .subscribe(() => { this.buscar(); this.cargarMetrics(); });
  }

  consultarLotes() {
    this.dteService
      .consultarLotesNow()
      .pipe(untilDestroyed(this))
      .subscribe(() => { this.buscar(); this.cargarMetrics(); });
  }

  reintentar(d: DocumentoElectronicoDto) {
    if (!d?.id) return;
    this.dteService
      .reintentarGeneracion(d.id)
      .pipe(untilDestroyed(this))
      .subscribe(() => { this.buscar(); this.cargarMetrics(); });
  }

  seedMock() {
    this.dteService.seedMock(30, 45).pipe(untilDestroyed(this)).subscribe(() => { this.buscar(); this.cargarMetrics(); });
  }

  wipeData() {
    this.dteService.wipeData().pipe(untilDestroyed(this)).subscribe(() => { this.buscar(); this.cargarMetrics(); });
  }

  onXml(d: DocumentoElectronicoView) {
    if (!d?.id) return;
    if (d.estadoSifen === 'GENERADO' || d.estadoSifen === 'APROBADO') {
      // Descargar
      this.dteService.getById(d.id)
        .pipe(untilDestroyed(this))
        .subscribe((res: any) => {
          const det = res?.data as any;
          const xml = det?.xmlFirmado as string;
          if (!xml) return;
          const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `dte-${d.id}.xml`;
          a.click();
          URL.revokeObjectURL(url);
        });
    } else {
      // Generar
      this.reintentar(d);
    }
  }

  registrarCancelacion(d: DocumentoElectronicoDto) {
    if (!d?.id) return;
    const ref = this.dialog.open(EventoDteDialogComponent, {
      width: '480px',
      data: { titulo: 'Registrar Cancelación', tipoEvento: 1 },
    });
    ref.afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res?: { motivo?: string; observacion?: string }) => {
        if (!res?.motivo) return;
        this.dteService
          .registrarEvento(d.id, 1, res.motivo, res.observacion)
          .pipe(untilDestroyed(this))
          .subscribe(() => { this.buscar(); this.cargarMetrics(); });
      });
  }

  registrarConformidad(d: DocumentoElectronicoDto) {
    if (!d?.id) return;
    const ref = this.dialog.open(EventoDteDialogComponent, {
      width: '480px',
      data: { titulo: 'Conformidad del receptor', tipoEvento: 2 },
    });
    ref.afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res?: { motivo?: string; observacion?: string }) => {
        if (!res?.motivo) return;
        this.dteService
          .registrarEvento(d.id, 2, res.motivo, res.observacion)
          .pipe(untilDestroyed(this))
          .subscribe(() => { this.buscar(); this.cargarMetrics(); });
      });
  }

  registrarDisconformidad(d: DocumentoElectronicoDto) {
    if (!d?.id) return;
    const ref = this.dialog.open(EventoDteDialogComponent, {
      width: '480px',
      data: { titulo: 'Disconformidad del receptor', tipoEvento: 3 },
    });
    ref.afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res?: { motivo?: string; observacion?: string }) => {
        if (!res?.motivo) return;
        this.dteService
          .registrarEvento(d.id, 3, res.motivo, res.observacion)
          .pipe(untilDestroyed(this))
          .subscribe(() => { this.buscar(); this.cargarMetrics(); });
      });
  }

  registrarInutilizacion(d: DocumentoElectronicoDto) {
    if (!d?.id) return;
    const ref = this.dialog.open(EventoDteDialogComponent, {
      width: '480px',
      data: { titulo: 'Inutilización', tipoEvento: 4 },
    });
    ref.afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res?: { motivo?: string; observacion?: string }) => {
        if (!res?.motivo) return;
        this.dteService
          .registrarEvento(d.id, 4, res.motivo, res.observacion)
          .pipe(untilDestroyed(this))
          .subscribe(() => { this.buscar(); this.cargarMetrics(); });
      });
  }

  generarQr(d: DocumentoElectronicoDto) {
    if (!d?.urlQr) return;
    window.open(d.urlQr, '_blank');
  }

  verEventos(d: DocumentoElectronicoDto) {
    if (!d?.id) return;
    this.dialog.open(EventosDteViewDialogComponent, {
      width: '720px',
      data: { dteId: d.id },
    });
  }
}


