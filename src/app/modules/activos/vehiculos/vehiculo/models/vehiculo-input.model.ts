export interface VehiculoInput {
    id?: number;
    modeloId?: number;
    tipoVehiculoId?: number;
    chapa?: string;
    color?: string;
    anho?: number;
    documentacion?: boolean;
    refrigerado?: boolean;
    nuevo?: boolean;
    fechaAdquisicion?: string;
    primerKilometraje?: number;
    capacidadKg?: number;
    capacidadPasajeros?: number;
    imagenesVehiculo?: string;
    imagenesDocumentos?: string;
    usuarioId?: number;
    situacionPago?: string;
    proveedorId?: number;
    monedaId?: number;
    montoTotal?: number;
    montoYaPagado?: number;
    cantidadCuotas?: number;
    cantidadCuotasPagadas?: number;
    diaVencimiento?: number;
}
