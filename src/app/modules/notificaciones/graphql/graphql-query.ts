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


export const notificacionesUsuarioQuery = gql`
  query ($leidas: Boolean, $page: Int, $size: Int, $estadoTablero: String, $fechaInicio: String, $fechaFin: String) {
    data: notificacionesUsuario(leidas: $leidas, page: $page, size: $size, estadoTablero: $estadoTablero, fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
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


export const notificacionesUsuarioLegacyQuery = gql`
  query ($tokenFcm: String, $leidas: Boolean, $page: Int, $size: Int, $estadoTablero: String) {
    data: notificacionesUsuarioLegacy(tokenFcm: $tokenFcm, leidas: $leidas, page: $page, size: $size, estadoTablero: $estadoTablero) {
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

export const conteoNotificacionesNoLeidasQuery = gql`
  query {
    data: conteoNotificacionesNoLeidas
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

export const marcarTodasNotificacionesLeidasMutation = gql`
  mutation {
    data: marcarTodasNotificacionesLeidas
  }
`;

export const enviarNotificacionPersonalizadaMutation = gql`
  mutation ($titulo: String!, $mensaje: String!, $tipoEnvio: String!, $usuariosIds: [Int]) {
    data: enviarNotificacionPersonalizada(titulo: $titulo, mensaje: $mensaje, tipoEnvio: $tipoEnvio, usuariosIds: $usuariosIds)
  }
`;

export const usuariosActivosQuery = gql`
  query {
    data: usuariosActivos {
      id
      nickname
      persona {
        id
        nombre
      }
    }
  }
`;

export const comentariosNotificacionQuery = gql`
  query ($notificacionId: Int!) {
    data: comentariosNotificacion(notificacionId: $notificacionId) {
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

export const conteoComentariosNotificacionQuery = gql`
  query ($notificacionId: Int!) {
    data: conteoComentariosNotificacion(notificacionId: $notificacionId)
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

export const usuariosDestinatariosNotificacionQuery = gql`
  query ($notificacionId: Int!) {
    data: usuariosDestinatariosNotificacion(notificacionId: $notificacionId) {
      id
      nickname
      persona {
        id
        nombre
      }
    }
  }
`;

export const usuariosConAccesoNotificacionQuery = gql`
  query ($notificacionId: Int!) {
    data: usuariosConAccesoNotificacion(notificacionId: $notificacionId) {
      id
      nickname
      persona {
        id
        nombre
      }
    }
  }
`;

