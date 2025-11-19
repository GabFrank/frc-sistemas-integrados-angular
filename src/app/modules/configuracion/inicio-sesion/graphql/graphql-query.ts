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
