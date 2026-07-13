import gql from "graphql-tag";

export const colectarDevolucionMutation = gql`
  mutation ($devolucionId: ID!, $sucursalDestinoId: ID!, $usuarioId: ID) {
    data: colectarDevolucion(
      devolucionId: $devolucionId
      sucursalDestinoId: $sucursalDestinoId
      usuarioId: $usuarioId
    ) {
      id
      estado
      sucursalUbicacion {
        id
        nombre
      }
    }
  }
`;

export const colectarDevolucionesEnBloqueMutation = gql`
  mutation ($devolucionIds: [ID!]!, $sucursalDestinoId: ID!, $usuarioId: ID) {
    data: colectarDevolucionesEnBloque(
      devolucionIds: $devolucionIds
      sucursalDestinoId: $sucursalDestinoId
      usuarioId: $usuarioId
    ) {
      resultados {
        id
        ok
        mensaje
      }
    }
  }
`;
