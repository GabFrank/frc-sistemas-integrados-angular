import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { FormaPago } from '../../../financiero/forma-pago/forma-pago.model';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { PdvCaja } from '../../../financiero/pdv/caja/caja.model';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { Pago } from '../pago.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { PagoDetalleCuota, PagoDetalleCuotaEstado } from '../pago-detalle-cuota/pago-detalle-cuota.model';

export enum PagoDetalleEstado {
    ABIERTO = 'ABIERTO',
    PENDIENTE = 'PENDIENTE',
    PAGO_PARCIAL = 'PAGO_PARCIAL',
    CONCLUIDO = 'CONCLUIDO',
    CANCELADO = 'CANCELADO'
}

export class PagoDetalle {
    id: number;
    pago: Pago;
    usuario: Usuario;
    creadoEn: Date;
    moneda: Moneda;
    formaPago: FormaPago;
    total: number;
    sucursal: Sucursal;
    caja: PdvCaja;
    activo: boolean;
    fechaProgramado: Date;
    plazo: boolean;
    cuotas: number;
    estado: PagoDetalleEstado;

    toInput(): PagoDetalleInput {
        let input = new PagoDetalleInput();
        input.id = this?.id;
        input.pagoId = this?.pago?.id;
        input.usuarioId = this?.usuario?.id;
        input.creadoEn = dateToString(this?.creadoEn);
        input.monedaId = this?.moneda?.id;
        input.formaPagoId = this?.formaPago?.id;
        input.total = this?.total;
        input.sucursalId = this?.sucursal?.id;
        input.cajaId = this?.caja?.id;
        input.activo = this?.activo;
        input.fechaProgramado = dateToString(this?.fechaProgramado);
        input.plazo = this?.plazo;
        input.cuotas = this?.cuotas;
        input.estado = this?.estado;
        return input;
    }

    /**
     * Updates the estado of the PagoDetalle based on the estado of its associated cuotas.
     * @param pagoDetalleCuotas Array of PagoDetalleCuota associated with this PagoDetalle
     * @returns The updated PagoDetalle estado
     */
    updateEstadoBasedOnCuotas(pagoDetalleCuotas: PagoDetalleCuota[]): PagoDetalleEstado {
        console.log('PagoDetalle.updateEstadoBasedOnCuotas called', {
            id: this.id,
            currentEstado: this.estado,
            total: this.total,
            cuotasLength: pagoDetalleCuotas?.length || 0
        });
        
        // If estado is already CANCELADO, keep it
        if (this.estado === PagoDetalleEstado.CANCELADO) {
            console.log('Estado already CANCELADO, keeping it');
            return PagoDetalleEstado.CANCELADO;
        }

        // If there are no cuotas, keep the current estado
        if (!pagoDetalleCuotas || pagoDetalleCuotas.length === 0) {
            console.log('No cuotas, keeping current estado:', this.estado || PagoDetalleEstado.ABIERTO);
            return this.estado || PagoDetalleEstado.ABIERTO;
        }

        // Filter out CANCELADO cuotas as they don't participate in the calculation
        const activeCuotas = pagoDetalleCuotas.filter(cuota => 
            cuota.estado !== PagoDetalleCuotaEstado.CANCELADO
        );
        console.log('Active cuotas (excluding CANCELADO):', activeCuotas.length);

        // If no active cuotas exist after filtering, default to ABIERTO
        if (activeCuotas.length === 0) {
            console.log('No active cuotas after filtering, returning ABIERTO');
            return PagoDetalleEstado.ABIERTO;
        }

        // Check if any cuota has PAGO_PARCIAL estado
        const hasPagoParcial = activeCuotas.some(cuota => 
            cuota.estado === PagoDetalleCuotaEstado.PAGO_PARCIAL
        );
        if (hasPagoParcial) {
            console.log('Has at least one PAGO_PARCIAL cuota, returning PAGO_PARCIAL');
            this.estado = PagoDetalleEstado.PAGO_PARCIAL;
            return PagoDetalleEstado.PAGO_PARCIAL;
        }

        // Check if all cuotas are CONCLUIDO
        const allConcluido = activeCuotas.every(cuota => 
            cuota.estado === PagoDetalleCuotaEstado.PAGADO
        );
        if (allConcluido) {
            console.log('All cuotas are PAGADO, returning CONCLUIDO');
            this.estado = PagoDetalleEstado.CONCLUIDO;
            return PagoDetalleEstado.CONCLUIDO;
        }

        // Check for PENDIENTE: all cuotas must be PENDIENTE and sum must match total
        const allPendiente = activeCuotas.every(cuota => 
            cuota.estado === PagoDetalleCuotaEstado.PENDIENTE
        );
        
        console.log('All cuotas PENDIENTE?', allPendiente);
        
        if (allPendiente) {
            // Check if sum of cuotas matches the total
            const cuotasSum = activeCuotas.reduce((sum, cuota) => sum + (cuota.totalFinal || 0), 0);
            const totalMatch = Math.abs(this.total - cuotasSum) < 0.01; // Using small threshold for floating point comparison
            
            console.log('Checking total match:', {
                cuotasSum,
                pagoDetalleTotal: this.total,
                difference: Math.abs(this.total - cuotasSum),
                totalMatches: totalMatch
            });
            
            if (totalMatch) {
                console.log('All cuotas are PENDIENTE and total matches, returning PENDIENTE');
                this.estado = PagoDetalleEstado.PENDIENTE;
                return PagoDetalleEstado.PENDIENTE;
            } else {
                console.log('All cuotas are PENDIENTE but total does not match, returning ABIERTO');
            }
        } else {
            console.log('Not all cuotas are PENDIENTE, returning ABIERTO');
        }
        
        // Default to ABIERTO if no other conditions match
        console.log('Default case, returning ABIERTO');
        this.estado = PagoDetalleEstado.ABIERTO;
        return PagoDetalleEstado.ABIERTO;
    }

    /**
     * Cancels the PagoDetalle by setting its estado to CANCELADO
     * All associated cuotas should be updated to CANCELADO separately
     */
    cancel(): void {
        this.estado = PagoDetalleEstado.CANCELADO;
    }
}

export class PagoDetalleInput {
    id?: number;
    pagoId?: number;
    usuarioId?: number;
    creadoEn?: string;
    monedaId?: number;
    formaPagoId?: number;
    total?: number;
    sucursalId?: number;
    cajaId?: number;
    activo?: boolean;
    fechaProgramado?: string;
    plazo?: boolean;
    cuotas?: number;
    estado?: PagoDetalleEstado;
} 