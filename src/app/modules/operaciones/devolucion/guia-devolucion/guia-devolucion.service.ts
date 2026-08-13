import { Injectable } from "@angular/core";
import {
  DEFAULT_GUIA_DEVOLUCION,
  GuiaContenido,
} from "./guia-devolucion.model";

/**
 * Persistencia del contenido de la guia del modulo de Devoluciones.
 *
 * Implementacion actual: localStorage (por instalacion). Suficiente para una
 * primera version editable por rol.
 *
 * TODO (persistencia compartida): reemplazar cargar()/guardar() por una
 * query/mutation GraphQL contra el central (ej. getGuia(modulo) /
 * saveGuia(modulo, contenido)) para que la edicion de un admin se vea en todos
 * los equipos. La firma de estos metodos ya esta pensada para ese cambio: los
 * componentes no necesitan tocarse, solo esta clase.
 */
@Injectable({ providedIn: "root" })
export class GuiaDevolucionService {
  private readonly STORAGE_KEY = "guia_devolucion_v1";

  cargar(): GuiaContenido {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GuiaContenido;
        if (parsed && parsed.secciones) {
          return parsed;
        }
      }
    } catch (e) {
      // si el contenido guardado esta corrupto, se ignora y se usa el default
    }
    return this.clonarDefault();
  }

  guardar(contenido: GuiaContenido, usuario?: string): GuiaContenido {
    const limpio = this.limpiarTransitorios(contenido);
    limpio.actualizadoEn = new Date().toISOString();
    if (usuario) {
      limpio.actualizadoPor = usuario;
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limpio));
    return limpio;
  }

  restaurarDefault(): GuiaContenido {
    localStorage.removeItem(this.STORAGE_KEY);
    return this.clonarDefault();
  }

  private clonarDefault(): GuiaContenido {
    return JSON.parse(JSON.stringify(DEFAULT_GUIA_DEVOLUCION));
  }

  // Quita los campos calculados en runtime (prefijo "_") antes de persistir.
  private limpiarTransitorios(contenido: GuiaContenido): GuiaContenido {
    const clon: GuiaContenido = JSON.parse(
      JSON.stringify(contenido, (key, value) =>
        key.startsWith("_") ? undefined : value
      )
    );
    return clon;
  }
}
