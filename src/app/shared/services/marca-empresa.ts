import { electronBridge } from '../../commons/core/electron/electron-bridge';

/**
 * Marca (logo) según el nombre de la empresa de `configuracion_general`: farmacia o bodega.
 * Las imágenes viven en los assets de la app, no se piden al servidor (igual que el logo del login).
 */
export type MarcaEmpresa = 'bodega' | 'farmacia';

export function marcaDeEmpresa(nombreEmpresa: string): MarcaEmpresa {
  return (nombreEmpresa ?? '').toUpperCase().includes('FARMACIA') ? 'farmacia' : 'bodega';
}

/** Mismos archivos que declara `src/index.html` (con su `?v=`), más los de la farmacia. */
const FAVICONS: Record<MarcaEmpresa, { png: string; ico: string }> = {
  bodega: { png: 'assets/images/frc.png?v=2', ico: 'favicon.ico?v=2' },
  farmacia: { png: 'assets/images/frc-farmacia.png?v=1', ico: 'assets/icons/farmacia/favicon.ico?v=1' },
};

/**
 * Pone el logo de la empresa en la pestaña del navegador (versión web) y en la ventana y la barra
 * de tareas (Electron, por IPC: el main solo acepta 'bodega' o 'farmacia', nunca una ruta).
 */
export function aplicarMarca(marca: MarcaEmpresa): void {
  try {
    const iconos = FAVICONS[marca];
    document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]').forEach((link) => {
      const href = link.type === 'image/x-icon' ? iconos.ico : iconos.png;
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
    });
  } catch {}
  electronBridge()?.send('set-window-icon', marca);
}
