/**
 * Imprime un ticket desde el navegador (#231), sin Electron.
 *
 * El botón de imprimir del visor (pdf.js) fija la hoja al tamaño exacto del PDF
 * (`@page { size }`). Una térmica no tiene ese papel, así que Chrome centra la hoja
 * en el rollo y la impresora avanza todo el blanco de arriba antes de imprimir.
 *
 * Acá el ticket va como imagen en una página **sin tamaño de hoja**: Chrome usa el
 * papel de la impresora (rollo de 58/80mm), empieza desde arriba, y el driver
 * descarta el blanco que sobra abajo.
 */

/** Resolución de las térmicas comunes (8 puntos/mm). */
const DPI_TERMICA = 203;
/** Se dibuja al doble para que el driver no tenga que agrandar la imagen. */
const SOBREMUESTREO = 2;

/** Ancho en píxeles con que se dibuja cada página del ticket. */
export function anchoPxTicket(anchoMm: number): number {
  return Math.round(anchoMm / 25.4 * DPI_TERMICA * SOBREMUESTREO);
}

/** Abre el diálogo de impresión del sistema con las páginas del ticket, una debajo de otra. */
export function imprimirTicketEnNavegador(paginas: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(iframe);

    const quitar = () => setTimeout(() => iframe.remove(), 1000);
    const win = iframe.contentWindow;
    const doc = iframe.contentDocument;
    if (!win || !doc) {
      iframe.remove();
      reject(new Error('No se pudo preparar la impresión'));
      return;
    }

    // Sin `size` en @page: manda el papel de la impresora. margin:0 para usar todo el ancho.
    doc.open();
    doc.write('<!doctype html><html><head><meta charset="utf-8"><title>Ticket</title><style>'
      + '@page{margin:0}html,body{margin:0;padding:0;background:#fff}'
      + 'img{display:block;width:100%;height:auto}'
      + '</style></head><body>'
      + paginas.map(src => `<img src="${src}">`).join('')
      + '</body></html>');
    doc.close();

    const imagenes = Array.from(doc.images);
    const cargadas = imagenes.map(img => img.complete
      ? Promise.resolve()
      : new Promise<void>(ok => { img.onload = () => ok(); img.onerror = () => ok(); }));

    Promise.all(cargadas).then(() => {
      try {
        win.focus();
        win.print();
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        quitar();
      }
    });
  });
}
