import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as L from 'leaflet';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { take } from 'rxjs/operators';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';
import { CONSULTA_GPS, GpsService, LECTURA_GPS } from '../../service/gps.service';
import { VehiculoService } from '../../../vehiculo/service/vehiculo.service';
import { Vehiculo } from '../../../vehiculo/models/vehiculo.model';
import { VehiculoSearchPageGQL } from '../../../vehiculo/graphql/vehiculoSearchPage';
import { GpsWebSocketService, TelemetriaWsDTO } from '../../service/gps-websocket.service';
import { Gps } from '../../models/gps.model';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../../../shared/components/search-list-dialog/search-list-dialog.component';

@UntilDestroy()
@Component({
  selector: 'list-mapas',
  templateUrl: './list-mapas.component.html',
  styleUrls: ['./list-mapas.component.scss']
})
export class ListMapasComponent implements OnInit, AfterViewInit, OnDestroy {

  private gpsService = inject(GpsService);
  private vehiculoService = inject(VehiculoService);
  private wsService = inject(GpsWebSocketService);
  private cdr = inject(ChangeDetectorRef);
  private matDialog = inject(MatDialog);
  private vehiculoSearchPageGQL = inject(VehiculoSearchPageGQL);
  private notificacionService = inject(NotificacionSnackbarService);

  private map: L.Map | undefined;
  private markers: Map<number, L.Marker> = new Map();
  private initRetryCount = 0;
  /** Fecha (ms) de la última posición aplicada a cada marcador: una carga desde la base no lo mueve hacia atrás. */
  private fechaMarcador: Map<number, number> = new Map();
  /** Solo se aplica la última carga de posiciones pedida (dos vehículos elegidos seguidos, reintentos). */
  private lectura = 0;
  private encuadrado = false;

  /** No se pudieron leer las últimas posiciones: el mapa solo muestra lo que llegue en vivo. */
  posicionesFallo = false;
  /** Hay un cambio de filtro esperando respuesta: un reintento no lo descarta. */
  private cambioDeFiltroEnVuelo = false;

  // Estado de conexión WebSocket
  wsConnected = false;
  lastUpdate: Date | null = null;

  vehiculoSelected: Vehiculo | null = null;
  vehiculoDescripcion: string = '';

  private actualizarVehiculoDescripcion(): void {
    if (this.vehiculoSelected) {
      this.vehiculoDescripcion = `${this.vehiculoSelected.chapa} - ${this.vehiculoSelected.modelo?.descripcion || ''}`.toUpperCase();
    } else {
      this.vehiculoDescripcion = '';
    }
  }

  // Icono personalizado para vehículos
  private carIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style='background-color: #4CAF50; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); transition: all 0.3s ease;'>
            <i class="material-icons" style="color: white; font-size: 18px;">directions_car</i>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  // Icono para vehículo detenido
  private carStoppedIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style='background-color: #FF9800; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);'>
            <i class="material-icons" style="color: white; font-size: 18px;">directions_car</i>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  // Icono para vehículo sin señal
  private carOfflineIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style='background-color: #9E9E9E; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);'>
            <i class="material-icons" style="color: white; font-size: 18px;">directions_car</i>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  ngOnInit(): void {
    this.setupWebSocket();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private setupWebSocket(): void {
    this.wsService.connectionStatus$
      .pipe(untilDestroyed(this))
      .subscribe(connected => {
        this.wsConnected = connected;
        this.cdr.markForCheck();
      });

    this.wsService.telemetria$
      .pipe(untilDestroyed(this))
      .subscribe(telemetria => {
        this.procesarTelemetriaWs(telemetria);
      });

    this.wsService.connect();
  }
  private procesarTelemetriaWs(telemetria: TelemetriaWsDTO): void {
    const selectedVehiculo = this.vehiculoSelected;

    // GraphQL entrega los ids como texto y el websocket como número: comparados tal cual nunca coinciden y se
    // descartaba toda la telemetría del vehículo filtrado.
    if (selectedVehiculo && selectedVehiculo.id && Number(telemetria.vehiculoId) !== Number(selectedVehiculo.id)) {
      return;
    }

    this.updateMarkerFromWs(telemetria);
    this.lastUpdate = new Date();
    this.cdr.markForCheck();
  }

  private updateMarkerFromWs(telemetria: TelemetriaWsDTO, desdeLaBase = false): void {
    if (!this.map || !telemetria.latitud || !telemetria.longitud) return;
    if (telemetria.latitud === 0 && telemetria.longitud === 0) return;

    const lat = telemetria.latitud;
    const lng = telemetria.longitud;

    const icon = this.getIconForTelemetria(telemetria);

    // Clave siempre numérica: el mismo GPS llega con id de texto (lista) y de número (websocket), y quedaba con
    // dos marcadores, uno quieto en la posición vieja.
    const gpsId = Number(telemetria.gpsId);
    let marker = this.markers.get(gpsId);
    // El central manda la fecha de la base como «yyyy-MM-dd HH:mm»: con la T la entiende cualquier navegador.
    const fecha = Date.parse(String(telemetria.fechaGps || '').replace(' ', 'T')) || 0;
    // La última posición guardada puede ser anterior a la que ya llegó en vivo.
    if (desdeLaBase && marker && fecha <= (this.fechaMarcador.get(gpsId) ?? 0)) return;
    this.fechaMarcador.set(gpsId, desdeLaBase ? fecha : (fecha || Date.now()));

    if (marker) {
      marker.setLatLng([lat, lng]);
      marker.setIcon(icon);
      this.updatePopupFromWs(marker, telemetria);
    } else {
      marker = L.marker([lat, lng], { icon }).addTo(this.map!);
      this.updatePopupFromWs(marker, telemetria);
      this.markers.set(gpsId, marker);
    }
  }

  private getIconForTelemetria(telemetria: TelemetriaWsDTO): L.DivIcon {
    if (telemetria.fechaGps) {
      const fechaGps = new Date(telemetria.fechaGps);
      const ahora = new Date();
      const diffMinutos = (ahora.getTime() - fechaGps.getTime()) / (1000 * 60);
      if (diffMinutos > 10) {
        return this.carOfflineIcon;
      }
    }

    if (telemetria.velocidad === 0) {
      return this.carStoppedIcon;
    }

    return this.carIcon;
  }

  private updatePopupFromWs(marker: L.Marker, telemetria: TelemetriaWsDTO): void {
    const vehiculoInfo = telemetria.vehiculoChapa
      ? `${telemetria.vehiculoChapa}`
      : telemetria.imei;

    const modeloInfo = telemetria.vehiculoMarca && telemetria.vehiculoModelo
      ? `<p style="margin: 5px 0; font-size: 12px; color: #666;">${telemetria.vehiculoMarca} ${telemetria.vehiculoModelo}</p>`
      : '';

    const fechaGps = telemetria.fechaGps
      ? new Date(telemetria.fechaGps).toLocaleString()
      : 'N/A';

    const ignicionStatus = telemetria.ignicion
      ? '<span style="color: #4CAF50;">●</span> Encendido'
      : '<span style="color: #f44336;">●</span> Apagado';

    const popupContent = `
      <div style="color: black; text-align: center; min-width: 180px;">
        <h4 style="margin: 0 0 5px 0; font-weight: bold; font-size: 16px;">${vehiculoInfo}</h4>
        ${modeloInfo}
        <hr style="margin: 8px 0; border: none; border-top: 1px solid #eee;">
        <p style="margin: 5px 0;"><strong>Velocidad:</strong> ${telemetria.velocidad || 0} km/h</p>
        <p style="margin: 5px 0;"><strong>Motor:</strong> ${ignicionStatus}</p>
        <p style="margin: 5px 0; font-size: 11px; color: #888;">Última actualización: ${fechaGps}</p>
      </div>
    `;

    marker.bindPopup(popupContent);
    marker.bindTooltip(`${vehiculoInfo} - ${telemetria.velocidad || 0} km/h`, {
      permanent: false,
      direction: 'top'
    });
  }


  private initMap(): void {
    const mapElement = document.getElementById('map');

    if (!mapElement) {
      if (this.initRetryCount < 10) {
        this.initRetryCount++;
        setTimeout(() => this.initMap(), 500);
      }
      return;
    }

    const rect = mapElement.getBoundingClientRect();
    if (rect.height === 0 || rect.width === 0) {
      if (this.initRetryCount < 10) {
        this.initRetryCount++;
        setTimeout(() => this.initMap(), 500);
      }
      return;
    }

    try {
      this.map = L.map('map', {
        center: [-24.064024386388734, -54.3079173796453],
        zoom: 14
      });

      const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19
      });

      const esriReference = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 19,
        pane: 'overlayPane'
      });

      const esriTransportation = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
        attribution: '',
        maxZoom: 19,
        pane: 'overlayPane'
      });

      const satelliteHybrid = L.layerGroup([esriSatellite, esriReference, esriTransportation]);

      const osmStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      });

      const googleMaps = L.tileLayer('http://mt0.google.com/vt/lyrs=m&hl=es&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps',
        maxZoom: 19
      });

      googleMaps.addTo(this.map);

      const baseMaps = {
        "OpenStreetMap": osmStandard,
        "Satelital + Nombres": satelliteHybrid,
        "Google Maps": googleMaps
      };

      L.control.layers(baseMaps).addTo(this.map);

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);

      this.cargarPosicionesIniciales();

    } catch (error) {
      console.error('Error inicializando mapa:', error);
    }
  }

  private cargarPosicionesIniciales(): void {
    this.cargarPosiciones(this.vehiculoSelected, true);
  }

  onReintentarPosiciones(): void {
    if (this.cambioDeFiltroEnVuelo) return;
    this.cargarPosiciones(this.vehiculoSelected, true);
  }

  /**
   * Lee las últimas posiciones de `candidato` (o de todos, con `null`). El candidato pasa a ser el vehículo elegido
   * —campo, filtro del websocket y marcadores— recién cuando su lectura llegó bien: si falla, nada cambió (#390).
   * Antes el campo y el filtro cambiaban primero, y ante un error quedaban los marcadores de la selección anterior.
   */
  private cargarPosiciones(candidato: Vehiculo | null, silencioso: boolean): void {
    const lectura = ++this.lectura;
    const cambiaFiltro = Number(candidato?.id ?? 0) !== Number(this.vehiculoSelected?.id ?? 0);
    this.cambioDeFiltroEnVuelo = cambiaFiltro;
    const consulta = candidato?.id
      ? this.gpsService.onGetByVehiculoId(candidato.id, LECTURA_GPS, CONSULTA_GPS, silencioso)
      : this.gpsService.onBuscar('', silencioso);

    consulta.pipe(take(1), untilDestroyed(this)).subscribe({
      next: (res) => {
        if (lectura !== this.lectura) return;
        this.cambioDeFiltroEnVuelo = false;
        const gpsList = res || [];
        this.posicionesFallo = false;
        if (cambiaFiltro) {
          this.vehiculoSelected = candidato;
          this.actualizarVehiculoDescripcion();
          this.markers.forEach(m => m.remove());
          this.markers.clear();
          this.fechaMarcador.clear();
        }
        this.updateMarkersFromGpsList(gpsList);
        this.encuadrar(candidato, gpsList, cambiaFiltro);
        this.cdr.markForCheck();
      },
      error: () => {
        if (lectura !== this.lectura) return;
        this.cambioDeFiltroEnVuelo = false;
        if (cambiaFiltro) {
          this.notificacionService.openWarn(candidato
            ? 'No se pudo cargar la posición del vehículo: el mapa sigue como estaba'
            : 'No se pudieron cargar las posiciones: el filtro sigue como estaba', 5);
        } else {
          this.posicionesFallo = true;
        }
        this.cdr.markForCheck();
      }
    });
  }

  /** Reencuadra al cambiar el filtro o en la primera carga buena; un reintento no mueve el mapa del usuario. */
  private encuadrar(candidato: Vehiculo | null, gpsList: Gps[], cambiaFiltro: boolean): void {
    if (!cambiaFiltro && this.encuadrado) return;
    this.encuadrado = true;
    if (candidato?.id) {
      const gps = gpsList[0];
      const lat = gps?.ultimaLatitud || gps?.ultimaTelemetria?.latitud;
      const lng = gps?.ultimaLongitud || gps?.ultimaTelemetria?.longitud;
      if (lat && lng) this.map?.setView([lat, lng], 16);
    } else {
      this.fitBoundsToMarkers();
    }
  }

  private updateMarkersFromGpsList(gpsList: Gps[]): void {
    if (!this.map) return;

    gpsList.forEach(gps => {
      let lat = gps.ultimaLatitud;
      let lng = gps.ultimaLongitud;
      let vel = gps.ultimaVelocidad || 0;
      let fechaGps: string | Date | undefined = gps.ultimaFechaReporte;
      let ignicion = gps.ultimaIgnicion || false;
      if (!lat || !lng) {
        if (gps.ultimaTelemetria?.latitud && gps.ultimaTelemetria?.longitud) {
          lat = gps.ultimaTelemetria.latitud;
          lng = gps.ultimaTelemetria.longitud;
          vel = gps.ultimaTelemetria.velocidad || 0;
          fechaGps = gps.ultimaTelemetria.fechaGps;
          ignicion = gps.ultimaTelemetria.ignicion || false;
        }
      }

      if (!lat || !lng || (lat === 0 && lng === 0)) return;

      let fechaGpsStr = '';
      if (fechaGps) {
        fechaGpsStr = fechaGps instanceof Date ? fechaGps.toISOString() : String(fechaGps);
      }

      const telemetria: TelemetriaWsDTO = {
        gpsId: Number(gps.id),
        imei: gps.imei,
        vehiculoId: gps.vehiculo?.id != null ? Number(gps.vehiculo.id) : null,
        vehiculoChapa: gps.vehiculo?.chapa || null,
        vehiculoModelo: gps.vehiculo?.modelo?.descripcion || null,
        vehiculoMarca: gps.vehiculo?.modelo?.marca?.descripcion || null,
        latitud: lat,
        longitud: lng,
        velocidad: vel,
        direccion: 0,
        ignicion: ignicion,
        alarma: 'NORMAL',
        fechaGps: fechaGpsStr,
        fechaServidor: new Date().toISOString(),
        activo: gps.activo || true,
        modeloTracker: gps.modeloTracker || ''
      };

      this.updateMarkerFromWs(telemetria, true);
    });
  }
  private fitBoundsToMarkers(): void {
    if (!this.map || this.markers.size === 0) return;

    const bounds = L.latLngBounds([]);

    this.markers.forEach(marker => {
      bounds.extend(marker.getLatLng());
    });

    this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  }

  private limpiarMarcadoresNoVisibles(visibleIds: Set<number>): void {
    Array.from(this.markers.keys()).forEach(id => {
      if (!visibleIds.has(id)) {
        const marker = this.markers.get(id);
        if (marker && this.map) {
          marker.remove();
        }
        this.markers.delete(id);
      }
    });
  }

  onBuscarVehiculo(): void {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'Id' },
      { id: 'chapa', nombre: 'Chapa' },
      { id: 'modelo.marca.descripcion', nombre: 'Marca' },
      { id: 'modelo.descripcion', nombre: 'Modelo' }
    ];

    const data: SearchListtDialogData = {
      query: this.vehiculoSearchPageGQL,
      tableData,
      titulo: 'Buscar Vehículo',
      search: true,
      inicialSearch: true,
      textHint: 'Buscar por chapa, marca o modelo...',
      paginator: true,
      queryData: { page: 0, size: 15 }
    };

    this.matDialog.open(SearchListDialogComponent, {
      data,
      width: '70%',
      height: '80%'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((res: Vehiculo) => {
      if (res) this.cargarPosiciones(res, false);
    });
  }

  onLimpiarVehiculo(event: Event): void {
    event.stopPropagation();
    this.cargarPosiciones(null, false);
  }

  reconnectWebSocket(): void {
    this.wsService.disconnect();
    setTimeout(() => this.wsService.connect(), 500);
  }
}
