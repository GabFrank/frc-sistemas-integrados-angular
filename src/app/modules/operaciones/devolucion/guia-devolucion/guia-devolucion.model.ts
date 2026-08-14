// Modelo de contenido de la guia/manual del modulo de Devoluciones.
// El contenido es data-driven para poder editarlo desde la UI (segun rol) y,
// mas adelante, persistirlo en el backend sin cambiar los componentes.

export type GuiaBloqueTipo =
  | "texto"
  | "pasos"
  | "nota"
  | "imagen"
  | "video"
  | "tabla";

export interface GuiaBloque {
  tipo: GuiaBloqueTipo;
  texto?: string; // texto | nota
  items?: string[]; // pasos
  url?: string; // imagen | video
  caption?: string; // imagen | video
  columnas?: string[]; // tabla
  filas?: string[][]; // tabla

  // Campos calculados en runtime (no se persisten).
  _embedUrl?: any; // SafeResourceUrl para iframe (youtube/vimeo/otros)
  _esVideoArchivo?: boolean; // true si es un archivo de video directo (.mp4/.webm)
}

export interface GuiaSeccion {
  id: string;
  titulo: string;
  icono?: string; // nombre de material icon
  bloques: GuiaBloque[];
}

export interface GuiaContenido {
  version: number;
  titulo: string;
  intro: string;
  secciones: GuiaSeccion[];
  actualizadoEn?: string;
  actualizadoPor?: string;
}

// Contenido por defecto (semilla). Si un admin edita, se guarda una copia
// editada; "Restaurar original" vuelve a este contenido.
export const DEFAULT_GUIA_DEVOLUCION: GuiaContenido = {
  version: 1,
  titulo: "Guía del módulo de Devoluciones",
  intro:
    "Registrá y controlá las salidas de mercadería por productos averiados o vencidos: " +
    "dalos de baja como pérdida (merma) o devolvelos al proveedor para recuperar su valor " +
    "con una nota de crédito o un cambio de producto. Todo queda trazado y con su estado.",
  secciones: [
    {
      id: "tipos",
      titulo: "Los 2 tipos de devolución",
      icono: "call_split",
      bloques: [
        {
          tipo: "texto",
          texto:
            "Cada documento de devolución es de uno de estos dos tipos. La diferencia define todo el flujo posterior.",
        },
        {
          tipo: "nota",
          texto:
            "SIN devolución a proveedor (Merma): el producto no se devuelve, está para descartar. " +
            "Se da de baja del stock y se genera un gasto por la pérdida. Ejemplo: vencidos o rotos que ya no sirven.",
        },
        {
          tipo: "nota",
          texto:
            "CON devolución a proveedor: el producto se devuelve al proveedor. Se genera un documento para " +
            "entregárselo, y él lo resuelve con una nota de crédito (registrás número y monto) o con un canje " +
            "(entrega producto de reemplazo, que reingresa al stock con nuevo vencimiento).",
        },
      ],
    },
    {
      id: "conceptos",
      titulo: "Conceptos clave",
      icono: "menu_book",
      bloques: [
        {
          tipo: "pasos",
          items: [
            "Tipo: con o sin devolución a proveedor. Define el flujo.",
            "Estado: en qué punto del proceso está la devolución.",
            "Motivo de avería: por qué sale el producto (vencido, averiado, roto, defecto, recall, error de pedido).",
            "Identificador de caja: código para separar físicamente la mercadería en una caja aparte.",
            "Vencimiento y lote: se registran por producto, para trazabilidad y para el reingreso por canje.",
            "Gasto de merma: la pérdida contable que genera una salida sin devolución a proveedor.",
            "Canje: cambio directo; el proveedor entrega reemplazo que reingresa al stock.",
            "Nota de crédito: el proveedor acredita el monto en vez de reponer producto.",
          ],
        },
      ],
    },
    {
      id: "estados",
      titulo: "Estados: el ciclo de vida",
      icono: "timeline",
      bloques: [
        {
          tipo: "texto",
          texto:
            "Toda devolución avanza por estados. El stock baja al pasar a Retirado (proveedor) o Descartado (merma).",
        },
        {
          tipo: "tabla",
          columnas: ["Estado", "Aplica a", "Qué representa", "Efecto"],
          filas: [
            ["Pendiente", "Ambos", "Documento recién creado; se cargan los productos.", "Ninguno todavía."],
            ["Separado", "Ambos", "Mercadería apartada físicamente en su caja con identificador.", "Reservado; el stock aún no baja."],
            ["Retirado", "Con proveedor", "El proveedor se llevó la mercadería.", "Baja el stock."],
            ["Canjeado", "Con proveedor", "El proveedor entregó producto de reemplazo.", "Reingresa al stock con nuevo vencimiento."],
            ["Acreditado", "Con proveedor", "El proveedor emitió una nota de crédito.", "Se registra Nº y monto."],
            ["Descartado", "Merma", "Producto dado de baja definitiva.", "Baja el stock y genera gasto."],
            ["Cancelada", "Ambos", "Devolución anulada antes de retirar/descartar.", "Sin efecto sobre el stock."],
          ],
        },
      ],
    },
    {
      id: "uso-desktop",
      titulo: "Cómo usarlo — en el Desktop",
      icono: "desktop_windows",
      bloques: [
        {
          tipo: "pasos",
          items: [
            "Abrí el módulo: menú Operaciones → Devoluciones → Nueva devolución.",
            "Elegí el tipo: con o sin devolución a proveedor. Si es con proveedor, seleccionalo.",
            "Agregá productos: cantidad, vencimiento, lote y motivo de avería de cada uno.",
            "Separá la mercadería: pasá la devolución a Separado; el sistema asigna un identificador para la caja.",
            "Cerrá según el caso: Merma → Descartar. Proveedor → Retirar, y luego Canjear o Acreditar.",
          ],
        },
        {
          tipo: "nota",
          texto:
            "La app está siempre en modo oscuro. Los textos que guardás se almacenan en MAYÚSCULAS: es normal.",
        },
      ],
    },
    {
      id: "uso-mobile",
      titulo: "Cómo usarlo — en el Mobile",
      icono: "smartphone",
      bloques: [
        {
          tipo: "pasos",
          items: [
            "Entrá a Devoluciones desde el acceso rápido del inicio o el menú de Operaciones.",
            "Elegí el tipo con el selector Sin proveedor / Con proveedor.",
            "Escaneá el producto: apuntá al código de barras y se reconoce solo.",
            "Completá el ítem: cantidad, vencimiento, lote y motivo de avería. Repetí con cada producto.",
            "Guardá: queda en Pendiente. Con 'Guardar y separar' pasa a Separado. El resto se cierra desde el desktop.",
          ],
        },
      ],
    },
    {
      id: "compras",
      titulo: "Alerta al comprar a un proveedor",
      icono: "notifications_active",
      bloques: [
        {
          tipo: "texto",
          texto:
            "Cuando iniciás una compra y elegís un proveedor que tiene devoluciones sin cerrar (separadas o " +
            "retiradas, todavía sin canjear ni acreditar), el sistema te avisa. Así podés reclamar la nota de " +
            "crédito o el canje en la misma negociación, en vez de dejarlo perder.",
        },
      ],
    },
    {
      id: "faq",
      titulo: "Preguntas frecuentes",
      icono: "help_outline",
      bloques: [
        {
          tipo: "pasos",
          items: [
            "¿Cuándo baja el stock? Al pasar a Retirado (proveedor) o Descartado (merma). En Separado aún figura en stock.",
            "¿Puedo cancelar? Sí, mientras esté en Pendiente o Separado. Después no, porque el stock ya se movió.",
            "En un canje, ¿cómo entra el producto nuevo? Al marcar Canjeado, reingresa al stock con el nuevo vencimiento que cargás.",
            "¿La merma descuenta plata de una caja? No por defecto: es pérdida contable. Imputarla a una caja es opcional.",
            "¿Para qué sirve el identificador? Para separar físicamente la mercadería devuelta y no confundirla con producto vendible.",
            "¿Puedo cargar en mobile y cerrar en desktop? Sí, es el flujo recomendado.",
          ],
        },
      ],
    },
  ],
};
