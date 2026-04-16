import gql from "graphql-tag";

export const reimprimirQuery = gql`
  query ($id: ID!, $printerName: String, $sucId: ID) {
    data: reimprimirGasto(id: $id, printerName: $printerName, sucId: $sucId)
  }
`;

export const saveGasto = gql`
  mutation saveGasto($entity: GastoInput!, $printerName: String, $local: String) {
    data: saveGasto(entity: $entity, printerName: $printerName, local: $local) {
      id
      responsable {
        id
        persona {
          id
          nombre
        }
      }
      tipoGasto {
        id
        descripcion
        autorizacion
      }
      autorizadoPor {
        id
        persona {
          id
          nombre
        }
      }
      observacion
      creadoEn
      usuario {
        id
        persona {
          id
          nombre
        }
      }
      retiroGs
      retiroRs
      retiroDs
      vueltoGs
      vueltoRs
      vueltoDs
      activo
      finalizado
      sucursalVuelto {
        id
        nombre
      }
    }
  }
`;

export const saveVueltoGasto = gql`
  mutation saveVueltoGasto($id: ID!, $valorGs: Float, $valorRs: Float, $valorDs: Float) {
    data: saveVueltoGasto(id: $id, valorGs: $valorGs, valorRs: $valorRs, valorDs: $valorDs) {
      id
      sucursalId
      responsable {
        id
        persona {
          id
          nombre
        }
      }
      tipoGasto {
        id
        descripcion
        autorizacion
      }
      autorizadoPor {
        id
        persona {
          id
          nombre
        }
      }
      observacion
      creadoEn
      usuario {
        id
        persona {
          id
          nombre
        }
      }
      retiroGs
      retiroRs
      retiroDs
      vueltoGs
      vueltoRs
      vueltoDs
      activo
      finalizado
      sucursalVuelto {
        id
        nombre
      }
    }
  }
`;

export const gastosPorCajaIdQuery = gql`
  query ($id: ID!, $sucId: ID) {
    data: gastosPorCajaId(id: $id, sucId: $sucId) {
      id
      sucursalId
      responsable {
        id
        persona {
          id
          nombre
        }
      }
      tipoGasto {
        id
        descripcion
        autorizacion
      }
      autorizadoPor {
        id
        persona {
          id
          nombre
        }
      }
      observacion
      creadoEn
      usuario {
        id
        persona {
          id
          nombre
        }
      }
      retiroGs
      retiroRs
      retiroDs
      vueltoGs
      vueltoRs
      vueltoDs
      activo
      finalizado
      sucursalVuelto {
        id
        nombre
      }
    }
  }
`;

export const filterGastosQuery = gql`
  query ($id: ID, $cajaId: ID, $sucId: ID, $responsableId: ID, $descripcion: String, $page: Int, $size: Int) {
    data: filterGastos(id: $id, cajaId: $cajaId, sucId: $sucId, responsableId: $responsableId, descripcion: $descripcion, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        sucursal {
          id
          nombre
        }
        caja {
          id
          sucursalId
        }
        responsable {
          persona {
            nombre
          }
        }
        tipoGasto {
          descripcion
        }
        observacion
        retiroGs
        retiroRs
        retiroDs
        creadoEn
      }
    }
  }
`;

export const tipoGastosQuery = gql`
  query {
    data: tipoGastos {
      id
      descripcion
      autorizacion
      activo
    }
  }
`;

export const tipoGastoQuery = gql`
  query ($id: ID!) {
    data: tipoGasto(id: $id) {
      id
      descripcion
      autorizacion
      activo
      isClasificacion
      tipoNaturaleza
      moduloPadre
      cargo {
        id
      }
      clasificacionGasto {
        id
      }
      usuario {
        id
        persona {
          nombre
        }
      }
      creadoEn
    }
  }
`;

export const tipoGastosSearch = gql`
  query ($texto: String) {
    data: tipoGastosSearch(texto: $texto) {
      id
      descripcion
      autorizacion
      activo
    }
  }
`;

export const saveTipoGasto = gql`
  mutation saveTipoGasto($entity: TipoGastoInput!) {
    data: saveTipoGasto(tipoGasto: $entity) {
      id
      descripcion
      autorizacion
      activo
      isClasificacion
      tipoNaturaleza
      moduloPadre
      cargo {
        id
      }
      clasificacionGasto {
        id
      }
      usuario {
        id
        persona {
          nombre
        }
      }
      creadoEn
    }
  }
`;

export const deleteTipoGastoQuery = gql`
  mutation deleteTipoGasto($id: ID!) {
    deleteTipoGasto(id: $id)
  }
`;

// PreGasto
export const savePreGastoMutation = gql`
  mutation savePreGasto($entity: PreGastoInput!) {
    data: savePreGasto(entity: $entity) {
      id
      sucursalId
    }
  }
`;

export const autorizarPreGastoMutation = gql`
  mutation autorizarPreGasto($id: ID!, $autorizadorId: ID!, $sucId: ID) {
    data: autorizarPreGasto(id: $id, autorizadorId: $autorizadorId, sucId: $sucId) {
      id
      sucursalId
      estado
    }
  }
`;

export const rechazarPreGastoMutation = gql`
  mutation rechazarPreGasto($id: ID!, $motivo: String!, $sucId: ID) {
    data: rechazarPreGasto(id: $id, motivo: $motivo, sucId: $sucId) {
      id
      sucursalId
      estado
    }
  }
`;

export const tramitarPreGastoMutation = gql`
  mutation tramitarPreGasto($id: ID!, $sucId: ID) {
    data: tramitarPreGasto(id: $id, sucId: $sucId) {
      id
      sucursalId
      estado
    }
  }
`;

export const completarPreGastoMutation = gql`
  mutation completarPreGasto($id: ID!, $sucId: ID) {
    data: completarPreGasto(id: $id, sucId: $sucId) {
      id
      sucursalId
      estado
    }
  }
`;

export const deletePreGastoMutation = gql`
  mutation deletePreGasto($id: ID!, $sucId: ID) {
    deletePreGasto(id: $id, sucId: $sucId)
  }
`;

export const enviarPreGastoATesoreriaMutation = gql`
  mutation ($id: ID!, $sucId: ID, $usuarioId: ID) {
    data: enviarPreGastoATesoreria(id: $id, sucId: $sucId, usuarioId: $usuarioId) {
      id
      sucursalId
      estado
      solicitudPagoId
    }
  }
`;

export const filterPreGastosQuery = gql`
  query ($id: ID, $estado: String, $inicio: String, $fin: String, $page: Int, $size: Int) {
    data: filterPreGastos(id: $id, estado: $estado, inicio: $inicio, fin: $fin, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        sucursalId
        funcionario {
          id
          nombre
        }
        tipoGasto {
          id
          descripcion
        }
        descripcion
        moneda {
          id
          denominacion
          simbolo
        }
        montoSolicitado
        sucursalCaja {
          id
          nombre
        }
        estado
        qrToken
        autorizadoPor {
          id
          nombre
        }
        motivoRechazo
        montoRetirado
        montoGastado
        saldoDevolver
        solicitudPagoId
        creadoEn
      }
    }
  }
`;

export const filterTipoGastosQuery = gql`
  query ($naturaleza: String, $texto: String, $page: Int, $size: Int) {
    data: filterTipoGastos(naturaleza: $naturaleza, texto: $texto, page: $page, size: $size) {
      getTotalPages
      getTotalElements
      getNumberOfElements
      isFirst
      isLast
      hasNext
      hasPrevious
      getContent {
        id
        descripcion
        autorizacion
        activo
        isClasificacion
        tipoNaturaleza
        moduloPadre
        cargo {
          id
        }
        clasificacionGasto {
          id
          descripcion
        }
        usuario {
          id
          persona {
            nombre
          }
        }
        creadoEn
      }
    }
  }
`;

export const imprimirPreGastoQuery = gql`
  query ($id: ID!, $sucId: ID) {
    data: imprimirPreGasto(id: $id, sucId: $sucId)
  }
`;

export const imprimirSolicitudPagoMutation = gql`
  mutation ($id: ID!) {
    data: imprimirSolicitudPagoPDF(solicitudPagoId: $id)
  }
`;
