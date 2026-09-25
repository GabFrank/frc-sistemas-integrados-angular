import gql from 'graphql-tag';

/**
 * Abre una captura y devuelve lo necesario para dibujar el QR.
 *
 * Va contra el FILIAL: es él quien sirve la página que abre el teléfono, y el único que sabe por
 * qué interfaz lo alcanza un teléfono conectado al wifi del local.
 */
export const crearCapturaCuponMutation = gql`
  mutation crearCapturaCupon($cajaId: ID!, $sucursalId: ID!, $usuarioId: ID, $terminalPosId: ID) {
    data: crearCapturaCupon(cajaId: $cajaId, sucursalId: $sucursalId, usuarioId: $usuarioId, terminalPosId: $terminalPosId) {
      token
      url
      expiraEn
    }
  }
`;

/**
 * Estado actual de una captura.
 *
 * Es la red de contención de la subscription, no un duplicado: el observable del filial es
 * caliente, así que un desktop que se reinició o perdió la red un segundo pierde el aviso para
 * siempre. Con esto lo ve igual en el siguiente sondeo.
 */
export const capturaCuponQuery = gql`
  query capturaCupon($token: String!) {
    data: capturaCupon(token: $token) {
      id
      token
      cajaId
      estado
      textoOcr
      campos
      error
      msOcr
      intentos
    }
  }
`;

/**
 * El aviso de que una captura terminó: un **timbre, no el contenido**.
 *
 * **No trae el token, a propósito.** Por WebSocket el filial no tiene sesión, así que esta
 * subscription es anónima: cualquiera que abra un socket contra el filial en la LAN escucha lo
 * que se emita. El token es la credencial con la que `capturaCupon(token)` devuelve el texto del
 * cupón —código de autorización y monto—, y esa query sólo exige estar logueado, no ser el dueño
 * de la captura. Difundirlo dejaba a cualquier empleado leer las ventas de las otras cajas.
 *
 * Esta caja ya tiene su token desde que pidió la captura; lo único que necesita del aviso es
 * saber si la novedad es suya, y para eso alcanza `cajaId`.
 *
 * Llega también en ERROR: el cajero mira la caja, no el teléfono.
 */
export const capturaCuponSubQuery = gql`
  subscription capturaCuponSub {
    data: capturaCuponSub {
      cajaId
      estado
    }
  }
`;
