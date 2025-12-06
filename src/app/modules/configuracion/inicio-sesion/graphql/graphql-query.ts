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
  query ($leidas: Boolean, $page: Int, $size: Int, $estadoTablero: String) {
    data: getNotificacionesUsuario(leidas: $leidas, page: $page, size: $size, estadoTablero: $estadoTablero) {
      content {
        id
        leida
        fechaLeida
        fechaEntrega
        usuario {
          id
          nickname
        }
        notificacion {
          id
          titulo
          mensaje
          tipo
          data
          estadoTablero
          verificadoPorUsuario {
            id
            nickname
          }
          fechaVerificacion
          creadoEn
          conteoComentarios
        }
        creadoEn
      }
      pageNumber
      pageSize
      totalElements
      totalPages
    }
  }
`;


export const getNotificacionesUsuarioLegacyQuery = gql`
  query ($tokenFcm: String, $leidas: Boolean, $page: Int, $size: Int, $estadoTablero: String) {
    data: getNotificacionesUsuarioLegacy(tokenFcm: $tokenFcm, leidas: $leidas, page: $page, size: $size, estadoTablero: $estadoTablero) {
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
  mutation ($notificacionId: Int!) {
    data: marcarNotificacionLeida(notificacionId: $notificacionId)
  }
`;

export const cambiarEstadoTableroNotificacionMutation = gql`
  mutation ($notificacionId: Int!, $estado: String!) {
    data: cambiarEstadoTableroNotificacion(notificacionId: $notificacionId, estado: $estado)
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

export const getConteoNotificacionesNoLeidasQuery = gql`
  query {
    data: getConteoNotificacionesNoLeidas
  }
`;

export const actualizarTokenFcmMutation = gql`
  mutation ($tokenFcm: String!) {
    data: actualizarTokenFcm(tokenFcm: $tokenFcm)
  }
`;

export const notificarInicioSesionMutation = gql`
  mutation ($usuarioId: Int!) {
    data: notificarInicioSesion(usuarioId: $usuarioId)
  }
`;

export const enviarNotificacionPersonalizadaMutation = gql`
  mutation ($titulo: String!, $mensaje: String!, $tipoEnvio: String!, $usuariosIds: [Int]) {
    data: enviarNotificacionPersonalizada(titulo: $titulo, mensaje: $mensaje, tipoEnvio: $tipoEnvio, usuariosIds: $usuariosIds)
  }
`;

export const getUsuariosActivosQuery = gql`
  query {
    data: getUsuariosActivos {
      id
      nickname
      persona {
        id
        nombre
      }
    }
  }
`;

export const getComentariosNotificacionQuery = gql`
  query ($notificacionId: Int!) {
    data: getComentariosNotificacion(notificacionId: $notificacionId) {
      id
      comentario
      creadoEn
      actualizadoEn
      usuario {
        id
        nickname
        persona {
          id
          nombre
        }
      }
      comentarioPadre {
        id
        usuario {
          id
          nickname
        }
      }
    }
  }
`;

export const getConteoComentariosNotificacionQuery = gql`
  query ($notificacionId: Int!) {
    data: getConteoComentariosNotificacion(notificacionId: $notificacionId)
  }
`;

export const crearComentarioNotificacionMutation = gql`
  mutation ($notificacionId: Int!, $comentario: String!, $comentarioPadreId: Int) {
    data: crearComentarioNotificacion(notificacionId: $notificacionId, comentario: $comentario, comentarioPadreId: $comentarioPadreId) {
      id
      comentario
      creadoEn
      usuario {
        id
        nickname
        persona {
          id
          nombre
        }
      }
      comentarioPadre {
        id
      }
    }
  }
`;

export const getUsuariosDestinatariosNotificacionQuery = gql`
  query ($notificacionId: Int!) {
    data: getUsuariosDestinatariosNotificacion(notificacionId: $notificacionId) {
      id
      nickname
      persona {
        id
        nombre
      }
    }
  }
`;

export const getUsuariosConAccesoNotificacionQuery = gql`
  query ($notificacionId: Int!) {
    data: getUsuariosConAccesoNotificacion(notificacionId: $notificacionId) {
      id
      nickname
      persona {
        id
        nombre
      }
    }
  }
`;
