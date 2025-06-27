import gql from "graphql-tag";

// Main Queries
export const GET_SOLICITUD_PAGO_SUMMARY = gql`
  query GetSolicitudPagoSummary($pedidoId: ID!) {
    data: pedidoSolicitudPagoSummary(pedidoId: $pedidoId) {
      totalNotas
      notasAgrupadas
      notasSinAgrupar
      totalGrupos
      valorTotalNotas
      valorTotalAgrupado
      puedeProgresar
    }
  }
`;

export const GET_NOTAS_SIN_AGRUPAR = gql`
  query GetNotasSinAgrupar($pedidoId: ID!) {
    data: notaRecepcionesSinAgrupar(pedidoId: $pedidoId) {
      id
      numero
      fecha
      valor
      cantidadItens
      pedido {
        id
      }
      notaRecepcionAgrupada {
        id
      }
    }
  }
`;

export const GET_GRUPOS_DISPONIBLES = gql`
  query GetGruposDisponibles($proveedorId: ID!, $page: Int!, $size: Int!) {
    data: notaRecepcionListPorProveedorId(
      id: $proveedorId
      page: $page
      size: $size
    ) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        estado
        creadoEn
        cantNotas
        proveedor {
          id
          persona {
            nombre
          }
        }
        sucursal {
          id
          nombre
        }
        usuario {
          id
          nickname
          persona {
            nombre
          }
        }
        solicitudPago {
          id
          estado
          pago {
            id
            estado
          }
        }
      }
    }
  }
`;

export const GET_GRUPOS_CREADOS = gql`
  query GetGruposCreados($pedidoId: ID!) {
    data: gruposCreadosParaPedido(pedidoId: $pedidoId) {
      grupo {
        id
        estado
        creadoEn
        cantNotas
        proveedor {
          id
          persona {
            nombre
          }
        }
        sucursal {
          id
          nombre
        }
        usuario {
          id
          nickname
        }
      }
      notasAsignadas {
        id
        numero
        fecha
        valor
        cantidadItens
      }
      valorTotal
      puedeAgregarNotas
      puedeEliminar
      esGrupoExterno
    }
  }
`;


// Main Mutations
export const CREAR_GRUPO_Y_ASIGNAR = gql`
  mutation CrearGrupoYAsignarNotas(
    $proveedorId: ID!
    $sucursalId: ID
    $notaRecepcionIds: [ID!]!
    $descripcion: String
  ) {
    data: crearGrupoYAsignarNotas(
      proveedorId: $proveedorId
      sucursalId: $sucursalId
      notaRecepcionIds: $notaRecepcionIds
      descripcion: $descripcion
    ) {
      grupo {
        id
        estado
        creadoEn
        cantNotas
        valorTotal
        proveedor {
          id
          persona {
            nombre
          }
        }
        sucursal {
          id
          nombre
        }
        usuario {
          id
          nickname
        }
      }
      notasAfectadas {
        id
        numero
        fecha
        valor
        cantidadItens
      }
      mensaje
      success
    }
  }
`;

export const ASIGNAR_NOTAS_A_GRUPO_EXISTENTE = gql`
  mutation AsignarNotasAGrupoExistente(
    $grupoId: ID!
    $notaRecepcionIds: [ID!]!
  ) {
    data: asignarNotasAGrupoExistente(
      grupoId: $grupoId
      notaRecepcionIds: $notaRecepcionIds
    ) {
      grupo {
        id
        estado
        creadoEn
        cantNotas
        valorTotal
        proveedor {
          id
          persona {
            nombre
          }
        }
        sucursal {
          id
          nombre
        }
        usuario {
          id
          nickname
        }
      }
      notasAfectadas {
        id
        numero
        fecha
        valor
        cantidadItens
      }
      mensaje
      success
    }
  }
`;

export const FINALIZAR_SOLICITUD_PAGO_STEP = gql`
  mutation FinalizarSolicitudPagoStep($pedidoId: ID!) {
    data: finalizarSolicitudPagoStep(pedidoId: $pedidoId) {
      id
      estado
      tipo
      referenciaId
    }
  }
`;

// Interface definitions
export interface SolicitudPagoSummary {
  totalNotas: number;
  notasAgrupadas: number;
  notasSinAgrupar: number;
  totalGrupos: number;
  valorTotalNotas: number;
  valorTotalAgrupado: number;
  puedeProgresar: boolean;
}

export interface CrearGrupoYAsignarInput {
  proveedorId: string;
  sucursalId: string;
  notaRecepcionIds: string[];
  descripcion?: string;
}

export interface AsignarNotasAGrupoInput {
  grupoId: string;
  notaRecepcionIds: string[];
}

export interface GrupoOperacionResult {
  grupo: any; // NotaRecepcionAgrupada with valorTotal included
  notasAfectadas: any[]; // NotaRecepcion[]
  mensaje: string;
  success: boolean;
}

export interface SolicitudPagoStepResult {
  id: string;
  estado: string;
  creadoEn: string;
  tipo: string;
  referenciaId: string;
}
