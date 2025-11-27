import gql from "graphql-tag";

export const requestPushNotificationQuery = gql`
  query ($personaId: Int, $roleId: Int, $titulo: String, $mensaje: String) {
    data: requestPushNotification(
      personaId: $personaId
      roleId: $roleId
      titulo: $titulo
      mensaje: $mensaje
    )
  }
`;

export const notificacionesPorTokenQuery = gql`
  query ($tokenFcm: String!) {
    data: notificacionesPorToken(tokenFcm: $tokenFcm) {
      id
      leida
      fechaLeida
      fechaEnvio
      estadoEnvio
      estadoTablero
      notificacion {
        id
        titulo
        mensaje
        tipo
        creadoEn
      }
    }
  }
`;

export const getNotificacionesUsuarioQuery = gql`
  query ($tokenFcm: String, $leidas: Boolean, $page: Int, $size: Int, $estadoTablero: String) {
    data: getNotificacionesUsuario(tokenFcm: $tokenFcm, leidas: $leidas, page: $page, size: $size, estadoTablero: $estadoTablero) {
      content {
        id
        leida
        fechaLeida
        fechaEnvio
        estadoEnvio
        interactuada
        fechaInteraccion
        accionRealizada
        estadoTablero
        notificacion {
          id
          titulo
          mensaje
          tipo
          creadoEn
        }
      }
      pageNumber
      pageSize
      totalElements
      totalPages
    }
  }
`;

export const marcarNotificacionLeidaMutation = gql`
  mutation ($notificacionUsuarioId: Int!) {
    data: marcarNotificacionLeida(notificacionUsuarioId: $notificacionUsuarioId)
  }
`;

export const registrarInteraccionNotificacionMutation = gql`
  mutation ($notificacionUsuarioId: Int!, $accion: String!) {
    data: registrarInteraccionNotificacion(notificacionUsuarioId: $notificacionUsuarioId, accion: $accion)
  }
`;

export const actualizarEstadoTableroNotificacionMutation = gql`
  mutation ($notificacionUsuarioId: Int!, $estado: String!) {
    data: actualizarEstadoTableroNotificacion(notificacionUsuarioId: $notificacionUsuarioId, estado: $estado)
  }
`;
