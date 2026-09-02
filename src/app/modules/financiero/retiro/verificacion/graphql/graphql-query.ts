import gql from 'graphql-tag';

const verificacionFields = `
  id
  retiroId
  sucursalId
  creadoEn
  resultado
  rapida
  observacion
  anulada
  usuario {
    id
    persona { id nombre }
  }
  detalles {
    id
    declarado
    contado
    diferencia
    categoria
    moneda { id denominacion simbolo decimales }
  }
`;

export const verificacionDeRetiroQuery = gql`
  query ($retiroId: ID!, $sucursalId: ID!) {
    data: verificacionDeRetiro(retiroId: $retiroId, sucursalId: $sucursalId) {
      ${verificacionFields}
    }
  }
`;

export const verificarRetiroMutation = gql`
  mutation verificarRetiro(
    $retiroId: ID!
    $sucursalId: ID!
    $cajaVirtualId: ID!
    $conteos: [ConteoRetiroMonedaInput!]!
    $rapida: Boolean
    $observacion: String
  ) {
    data: verificarRetiro(
      retiroId: $retiroId
      sucursalId: $sucursalId
      cajaVirtualId: $cajaVirtualId
      conteos: $conteos
      rapida: $rapida
      observacion: $observacion
    ) {
      ${verificacionFields}
    }
  }
`;

export const anularVerificacionRetiroMutation = gql`
  mutation anularVerificacionRetiro($verificacionId: ID!, $motivo: String) {
    data: anularVerificacionRetiro(verificacionId: $verificacionId, motivo: $motivo) {
      ${verificacionFields}
    }
  }
`;

export const retiroCasosQuery = gql`
  query ($estado: EstadoCasoRetiro, $sucursalId: ID, $retiroId: ID, $desde: String, $hasta: String, $soloMios: Boolean, $page: Int, $size: Int) {
    data: retiroCasos(estado: $estado, sucursalId: $sucursalId, retiroId: $retiroId, desde: $desde, hasta: $hasta, soloMios: $soloMios, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        retiroId
        sucursalId
        estado
        creadoEn
        resueltoEn
        resolucion
        veredicto
        reintegroRetiroId
        responsablePersona { id nombre }
        retiro {
          id
          creadoEn
          responsable { id persona { id nombre } }
          usuario { id nickname persona { id nombre } }
          cajaSalida { id sucursalId }
        }
        abiertoPor { id persona { id nombre } }
        asignadoA { id persona { id nombre } }
        resueltoPor { id persona { id nombre } }
        verificacion {
          id
          rapida
          creadoEn
          observacion
          usuario { id persona { id nombre } }
          detalles {
            declarado
            contado
            diferencia
            categoria
            moneda { id denominacion simbolo decimales }
          }
        }
      }
    }
  }
`;

export const asignarRetiroCasoMutation = gql`
  mutation asignarRetiroCaso($casoId: ID!, $usuarioId: ID!) {
    data: asignarRetiroCaso(casoId: $casoId, usuarioId: $usuarioId) {
      id
      estado
      asignadoA { id persona { id nombre } }
    }
  }
`;

export const resolverRetiroCasoMutation = gql`
  mutation resolverRetiroCaso(
    $casoId: ID!
    $veredicto: VeredictoCasoRetiro!
    $resolucion: String!
    $responsablePersonaId: ID
    $reintegroRetiroId: ID
    $anularVerificacion: Boolean
  ) {
    data: resolverRetiroCaso(
      casoId: $casoId
      veredicto: $veredicto
      resolucion: $resolucion
      responsablePersonaId: $responsablePersonaId
      reintegroRetiroId: $reintegroRetiroId
      anularVerificacion: $anularVerificacion
    ) {
      id
      estado
      resolucion
      veredicto
      resueltoEn
      resueltoPor { id persona { id nombre } }
      responsablePersona { id nombre }
    }
  }
`;

export const soltarRetiroCasoMutation = gql`
  mutation soltarRetiroCaso($casoId: ID!) {
    data: soltarRetiroCaso(casoId: $casoId) {
      id
      estado
      asignadoA { id persona { id nombre } }
    }
  }
`;
