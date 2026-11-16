import gql from "graphql-tag";

export const productosRechazadosQuery = gql`
  query (
    $fuente: String
    $fechaInicio: String
    $fechaFin: String
    $sucursalId: ID
    $referenciaId: ID
    $texto: String
    $page: Int
    $size: Int
  ) {
    data: productosRechazados(
      fuente: $fuente
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      sucursalId: $sucursalId
      referenciaId: $referenciaId
      texto: $texto
      page: $page
      size: $size
    ) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      getContent {
        fuente
        etapa
        referenciaId
        itemId
        fecha
        productoId
        productoDescripcion
        presentacion
        cantidad
        motivo
        observacion
        origen
        destino
        usuario
      }
    }
  }
`;
