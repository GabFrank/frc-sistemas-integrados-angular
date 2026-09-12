import gql from 'graphql-tag';

/**
 * Lo que el PDV lee del FILIAL para poder trabajar sin internet. Sin `proveedorServicio`: alla
 * viaja el id pelado y el nombre no hace falta en la caja.
 */
export const formatosTerminalPosActivosQuery = gql`
  query formatosTerminalPosActivos {
    data: formatosTerminalPosActivos {
      id
      nombre
      tipo
      patron
      mapeo
      ejemplo
      activo
      proveedorServicioId
    }
  }
`;

/**
 * Los activos, pero pedidos al CENTRAL.
 *
 * Existe aparte de `formatosTerminalPosActivosQuery` porque el type `FormatoTerminalPos` esta
 * declarado DISTINTO en los dos backends: central expone `proveedorServicio` (el objeto, que es
 * lo que tiene para dar) y filial expone `proveedorServicioId` (el escalar, que es lo unico que
 * baja por replicacion). Mandarle a central la seleccion del filial hace que GraphQL rechace la
 * query ENTERA con "Cannot query field proveedorServicioId" --no degrada, no devuelve el resto:
 * la lista queda vacia y el alta de terminal, que exige formato, se vuelve imposible.
 *
 * El nombre de la operacion es el mismo en los dos lados; lo unico que cambia es que se pide.
 */
export const formatosTerminalPosActivosCentralQuery = gql`
  query formatosTerminalPosActivos {
    data: formatosTerminalPosActivos {
      id
      nombre
      tipo
      patron
      mapeo
      ejemplo
      activo
      proveedorServicio {
        id
        persona {
          id
          nombre
        }
      }
    }
  }
`;

/** ABM: va contra el CENTRAL, que es donde se administran los formatos. */
export const formatosTerminalPosQuery = gql`
  query formatosTerminalPos {
    data: formatosTerminalPos {
      id
      nombre
      tipo
      patron
      mapeo
      ejemplo
      activo
      creadoEn
      proveedorServicio {
        id
        persona {
          id
          nombre
        }
      }
    }
  }
`;

export const saveFormatoTerminalPosMutation = gql`
  mutation saveFormatoTerminalPos($input: FormatoTerminalPosInput!) {
    data: saveFormatoTerminalPos(input: $input) {
      id
      nombre
      tipo
      patron
      mapeo
      ejemplo
      activo
    }
  }
`;

export const desactivarFormatoTerminalPosMutation = gql`
  mutation desactivarFormatoTerminalPos($id: ID!) {
    data: desactivarFormatoTerminalPos(id: $id)
  }
`;

/**
 * Cuantas terminales usan este formato.
 *
 * Se consulta ANTES de ofrecer desactivar: el backend rechaza desactivar uno en uso, y es mejor
 * decirselo al usuario antes que dejarlo intentar y comerse el error.
 */
export const terminalesQueUsanFormatoQuery = gql`
  query terminalesQueUsanFormato($id: ID!) {
    data: terminalesQueUsanFormato(id: $id)
  }
`;

// ── El mapa del formato: derivación y persistencia ─────────────────────────────────────────
//
// Todo contra el CENTRAL. El ABM de formatos vive ahí, y desde esta entrega la captura de muestra
// y el motor OCR también: el ciclo entero (sacar la foto → leerla → proponer el mapa → guardarlo)
// se resuelve sin pasar por ningún filial.

/** Si el motor de OCR está disponible en central. Sin él no se puede derivar. */
export const lectorDeCuponesDisponibleQuery = gql`
  query {
    data: lectorDeCuponesDisponible
  }
`;

/** Abre una captura de muestra y devuelve lo necesario para dibujar el QR. */
export const crearCapturaMuestraMutation = gql`
  mutation crearCapturaMuestra($formatoTerminalPosId: ID!) {
    data: crearCapturaMuestra(formatoTerminalPosId: $formatoTerminalPosId) {
      token
      ruta
      url
      expiraEn
    }
  }
`;

/**
 * Estado de la muestra. Se sondea: acá no hay subscription, y no hace falta —el administrador
 * está mirando la pantalla mientras saca la foto, no cobrando.
 */
export const capturaMuestraQuery = gql`
  query capturaMuestra($token: String!) {
    data: capturaMuestra(token: $token) {
      token
      estado
      textoOcr
      error
      msOcr
    }
  }
`;

/** Propone el mapa. NO guarda nada. */
export const derivarMapaDeMuestraMutation = gql`
  mutation derivarMapaDeMuestra($token: String!, $formatoTerminalPosId: ID!) {
    data: derivarMapaDeMuestra(token: $token, formatoTerminalPosId: $formatoTerminalPosId) {
      campo
      etiqueta
      posicion
      valorLeido
      x1
      y1
      x2
      y2
      sinRegion
    }
  }
`;

export const cerrarCapturaMuestraMutation = gql`
  mutation cerrarCapturaMuestra($token: String!) {
    data: cerrarCapturaMuestra(token: $token)
  }
`;

/** El mapa que el formato ya tiene guardado. */
export const regionesDeFormatoQuery = gql`
  query regionesDeFormatoTerminalPos($formatoTerminalPosId: ID!) {
    data: regionesDeFormatoTerminalPos(formatoTerminalPosId: $formatoTerminalPosId) {
      id
      campo
      etiqueta
      posicion
      tipo
      obligatorio
      x1
      y1
      x2
      y2
      origen
      orden
    }
  }
`;

/**
 * Persiste el mapa derivado.
 *
 * Sobre un formato que ya tiene mapa NO pisa: devuelve `aplicado: false` con el diff, y hay que
 * volver a llamar con `confirmarSobrescritura`. Una región MANUAL no se toca nunca, ni con la
 * confirmación: es una corrección que alguien hizo mirando un cupón.
 */
export const guardarRegionesDerivadasMutation = gql`
  mutation guardarRegionesDerivadas(
    $formatoTerminalPosId: ID!
    $regiones: [FormatoTerminalPosRegionInput!]!
    $confirmarSobrescritura: Boolean
  ) {
    data: guardarRegionesDerivadas(
      formatoTerminalPosId: $formatoTerminalPosId
      regiones: $regiones
      confirmarSobrescritura: $confirmarSobrescritura
    ) {
      aplicado
      creadas
      actualizadas
      eliminadas
      conservadasManuales
      cambios
      mensaje
    }
  }
`;
