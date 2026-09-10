import gql from 'graphql-tag';

/**
 * Abre una captura y devuelve lo necesario para dibujar el QR.
 *
 * Va contra el FILIAL: es él quien sirve la página que abre el teléfono, y el único que sabe por
 * qué interfaz lo alcanza un teléfono conectado al wifi del local.
 */
export const crearCapturaCuponMutation = gql`
  mutation crearCapturaCupon($cajaId: ID!, $sucursalId: ID!, $usuarioId: ID) {
    data: crearCapturaCupon(cajaId: $cajaId, sucursalId: $sucursalId, usuarioId: $usuarioId) {
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
      error
      msOcr
      intentos
    }
  }
`;

/** El aviso que sale cuando el OCR termina. Llega también en ERROR. */
export const capturaCuponSubQuery = gql`
  subscription capturaCuponSub {
    data: capturaCuponSub {
      token
      cajaId
      estado
      textoOcr
      error
      msOcr
    }
  }
`;
