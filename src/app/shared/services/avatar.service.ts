import { Injectable } from '@angular/core';

/**
 * Datos calculados del avatar de un usuario
 */
export interface DatosAvatar {
    color: string;
    colorClaro: string;
    iniciales: string;
    avatarUrl: string;
}

/**
 * Interfaz base para usuario (mínimos datos requeridos)
 */
export interface UsuarioBase {
    id?: number;
    nickname?: string;
    persona?: {
        nombre?: string;
        imagenes?: string;
    };
}

/**
 * Paleta de colores para avatares
 */
const COLORES_AVATAR: readonly string[] = [
    '#f44336', '#E91E63', '#9C27B0', '#673AB7',
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
    '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
    '#795548', '#607D8B'
] as const;

/**
 * Servicio para calcular colores, iniciales y URLs de avatares.
 * Utiliza cache para optimizar el rendimiento.
 */
@Injectable({
    providedIn: 'root'
})
export class AvatarService {
    private readonly cacheColores = new Map<number, string>();
    private readonly cacheColoresClaros = new Map<number, string>();
    private readonly cacheIniciales = new Map<string, string>();

    /**
     * Obtiene el color asignado a un usuario basado en su ID
     */
    obtenerColor(usuarioId: number): string {
        if (!this.cacheColores.has(usuarioId)) {
            const color = COLORES_AVATAR[usuarioId % COLORES_AVATAR.length];
            this.cacheColores.set(usuarioId, color);
        }
        return this.cacheColores.get(usuarioId)!;
    }

    /**
     * Obtiene una versión clara/transparente del color del usuario
     */
    obtenerColorClaro(usuarioId: number): string {
        if (!this.cacheColoresClaros.has(usuarioId)) {
            const colorBase = this.obtenerColor(usuarioId);
            const hex = colorBase.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            this.cacheColoresClaros.set(usuarioId, `rgba(${r}, ${g}, ${b}, 0.25)`);
        }
        return this.cacheColoresClaros.get(usuarioId)!;
    }

    /**
     * Obtiene las iniciales de un usuario
     */
    obtenerIniciales(usuario: UsuarioBase): string {
        const clave = `${usuario.nickname || ''}-${usuario.persona?.nombre || ''}`;

        if (!this.cacheIniciales.has(clave)) {
            const nombre = usuario.persona?.nombre || usuario.nickname || 'U';
            const partes = nombre.trim().split(' ').filter(p => p.length > 0);

            let iniciales: string;
            if (partes.length >= 2) {
                iniciales = (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
            } else {
                iniciales = nombre.substring(0, Math.min(2, nombre.length)).toUpperCase();
            }

            this.cacheIniciales.set(clave, iniciales);
        }

        return this.cacheIniciales.get(clave)!;
    }

    /**
     * Obtiene la URL del avatar del usuario
     * Si el usuario tiene imagen personalizada, la usa.
     * Si no, genera un avatar con ui-avatars.com
     */
    obtenerAvatarUrl(usuario: UsuarioBase, colorHex?: string): string {
        if (usuario?.persona?.imagenes) {
            return usuario.persona.imagenes;
        }

        const fondo = colorHex ? colorHex.replace('#', '') : 'random';
        const nombre = encodeURIComponent(usuario?.nickname || 'U');
        return `https://ui-avatars.com/api/?name=${nombre}&background=${fondo}&color=fff&size=128&bold=true`;
    }

    /**
     * Calcula todos los datos del avatar de un usuario
     * Método de conveniencia para obtener todos los datos en una sola llamada
     */
    calcularDatosAvatar(usuario: UsuarioBase): DatosAvatar {
        const usuarioId = usuario.id || 0;
        const color = this.obtenerColor(usuarioId);

        return {
            color,
            colorClaro: this.obtenerColorClaro(usuarioId),
            iniciales: this.obtenerIniciales(usuario),
            avatarUrl: this.obtenerAvatarUrl(usuario, color)
        };
    }

    /**
     * Limpia el cache de colores (útil para testing)
     */
    limpiarCache(): void {
        this.cacheColores.clear();
        this.cacheColoresClaros.clear();
        this.cacheIniciales.clear();
    }
}
