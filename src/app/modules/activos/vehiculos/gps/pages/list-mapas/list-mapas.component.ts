import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as L from 'leaflet';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GpsService } from '../../service/gps.service';
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

  private map: L.Map | undefined;
  private markers: Map<number, L.Marker> = new Map();
  private initRetryCount = 0;

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

    if (selectedVehiculo && selectedVehiculo.id && telemetria.vehiculoId !== selectedVehiculo.id) {
      return;
    }

    this.updateMarkerFromWs(telemetria);
    this.lastUpdate = new Date();
    this.cdr.markForCheck();
  }

  private updateMarkerFromWs(telemetria: TelemetriaWsDTO): void {
    if (!this.map || !telemetria.latitud || !telemetria.longitud) return;
    if (telemetria.latitud === 0 && telemetria.longitud === 0) return;

    const lat = telemetria.latitud;
    const lng = telemetria.longitud;

    const icon = this.getIconForTelemetria(telemetria);

    let marker = this.markers.get(telemetria.gpsId);

    if (marker) {
      marker.setLatLng([lat, lng]);
      marker.setIcon(icon);
      this.updatePopupFromWs(marker, telemetria);
    } else {
      marker = L.marker([lat, lng], { icon }).addTo(this.map!);
      this.updatePopupFromWs(marker, telemetria);
      this.markers.set(telemetria.gpsId, marker);
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
    this.gpsService.onSearch('')
      .pipe(untilDestroyed(this))
      .subscribe(gpsList => {
        this.procesarDatosGpsIniciales(gpsList);
      });
  }

  private procesarDatosGpsIniciales(gpsList: Gps[]): void {
    const selectedVehiculo = this.vehiculoSelected;
    let filteredList = gpsList;

    if (selectedVehiculo && selectedVehiculo.id) {
      filteredList = gpsList.filter(g => g.vehiculo?.id === selectedVehiculo.id);
    }

    this.updateMarkersFromGpsList(filteredList);
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
        gpsId: gps.id,
        imei: gps.imei,
        vehiculoId: gps.vehiculo?.id || null,
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

      this.updateMarkerFromWs(telemetria);
    });


    if (this.markers.size > 0) {
      this.fitBoundsToMarkers();
    }
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
      if (res) {
        this.vehiculoSelected = res;
        this.actualizarVehiculoDescripcion();
        this.onVehiculoSelect();
        this.cdr.markForCheck();
      }
    });
  }

  onLimpiarVehiculo(event: Event): void {
    event.stopPropagation();
    this.vehiculoSelected = null;
    this.actualizarVehiculoDescripcion();
    this.onVehiculoSelect();
    this.cdr.markForCheck();
  }

  onVehiculoSelect(): void {
    const selectedVehiculo = this.vehiculoSelected;

    if (selectedVehiculo && selectedVehiculo.id) {

      this.gpsService.onGetByVehiculoId(selectedVehiculo.id)
        .pipe(untilDestroyed(this))
        .subscribe(gpsList => {
          this.markers.forEach(m => m.remove());
          this.markers.clear();

          this.updateMarkersFromGpsList(gpsList);

          if (gpsList.length > 0) {
            const gps = gpsList[0];
            const lat = gps.ultimaLatitud || gps.ultimaTelemetria?.latitud;
            const lng = gps.ultimaLongitud || gps.ultimaTelemetria?.longitud;
            if (lat && lng) {
              this.map?.setView([lat, lng], 16);
            }
          }
        });
    } else {
      this.cargarPosicionesIniciales();
    }
  }

  reconnectWebSocket(): void {
    this.wsService.disconnect();
    setTimeout(() => this.wsService.connect(), 500);
  }
}
