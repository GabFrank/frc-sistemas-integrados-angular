import gql from "graphql-tag";

export const transferenciasQuery = gql`
  {
    data: transferencias {
      id
      sucursalOrigen {
        id
        nombre
      }
      sucursalDestino {
        id
        nombre
      }
      isOrigen
      isDestino
      tipo
      estado
      observacion
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const transferenciaQuery = gql`
  query ($id: ID!) {
    data: transferencia(id: $id) {
      id
      sucursalOrigen {
        id
        nombre
      }
      sucursalDestino {
        id
        nombre
      }
      isOrigen
      isDestino
      tipo
      estado
      observacion
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      transferenciaItemList {
        id
        transferencia { 
          id
        }
        presentacionPreTransferencia {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        presentacionPreparacion {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        presentacionTransporte {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        presentacionRecepcion {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        cantidadPreTransferencia
        cantidadPreparacion
        cantidadTransporte
        cantidadRecepcion
        observacionPreTransferencia
        observacionPreparacion
        observacionTransporte
        observacionRecepcion
        vencimientoPreTransferencia
        vencimientoPreparacion
        vencimientoTransporte
        vencimientoRecepcion
        motivoModificacionPreTransferencia
        motivoModificacionPreparacion
        motivoModificacionTransporte
        motivoModificacionRecepcion
        motivoRechazoPreTransferencia
        motivoRechazoPreparacion
        motivoRechazoTransporte
        motivoRechazoRecepcion
        activo
        etapa
        poseeVencimiento
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

export const saveTransferencia = gql`
  mutation saveTransferencia($entity: TransferenciaInput!) {
    data: saveTransferencia(transferencia: $entity) {
      id
      sucursalOrigen {
        id
        nombre
      }
      sucursalDestino {
        id
        nombre
      }
      isOrigen
      isDestino
      tipo
      estado
      observacion
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const deleteTransferenciaQuery = gql`
  mutation deleteTransferencia($id: ID!) {
    deleteTransferencia(id: $id)
  }
`;

export const transferenciaPorFechaQuery = gql`
  query ($inicio: String, $fin: String) {
    data: transferenciaPorFecha(inicio: $inicio, fin: $fin) {
      id
      sucursalOrigen {
        id
        nombre
      }
      sucursalDestino {
        id
        nombre
      }
      isOrigen
      isDestino
      tipo
      estado
      observacion
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const finalizarTransferencia = gql`
  mutation finalizarTransferencia($id: ID!) {
    finalizarTransferencia(id: $id)
  }
`;

export const imprimirTransferencia = gql`
  query imprimirTransferencia($id: ID!) {
    imprimirTransferencia(id: $id)
  }
`;

export const saveTransferenciaItem = gql`
  mutation saveTransferenciaItem($entity: TransferenciaItemInput!) {
    data: saveTransferenciaItem(transferenciaItem: $entity) {
      id
        transferencia { 
          id
        }
        presentacionPreTransferencia {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        presentacionPreparacion {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        presentacionTransporte {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        presentacionRecepcion {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        cantidadPreTransferencia
        cantidadPreparacion
        cantidadTransporte
        cantidadRecepcion
        observacionPreTransferencia
        observacionPreparacion
        observacionTransporte
        observacionRecepcion
        vencimientoPreTransferencia
        vencimientoPreparacion
        vencimientoTransporte
        vencimientoRecepcion
        motivoModificacionPreTransferencia
        motivoModificacionPreparacion
        motivoModificacionTransporte
        motivoModificacionRecepcion
        motivoRechazoPreTransferencia
        motivoRechazoPreparacion
        motivoRechazoTransporte
        motivoRechazoRecepcion
        activo
        etapa
        poseeVencimiento
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

export const deleteTransferenciaItemQuery = gql`
  mutation deleteTransferenciaItem($id: ID!) {
    deleteTransferenciaItem(id: $id)
  }
`;

export const saveTransferenciaItemDetalle = gql`
  mutation saveTransferenciaItemDetalle($entity: TransferenciaItemDetalleInput!) {
    data: saveTransferenciaItemDetalle(transferenciaItemDetalle: $entity) {
      id
        transferencia { 
          id
        }
        presentacionPreTransferencia {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        presentacionPreparacion {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        presentacionTransporte {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        presentacionRecepcion {
          id
          producto {
            id
            descripcion
            codigoPrincipal
            costo {
              costoMedio
              ultimoPrecioCompra
            }
          }
          cantidad
          imagenPrincipal
          precioPrincipal {
            precio
          }
        }
        cantidadPreTransferencia
        cantidadPreparacion
        cantidadTransporte
        cantidadRecepcion
        observacionPreTransferencia
        observacionPreparacion
        observacionTransporte
        observacionRecepcion
        vencimientoPreTransferencia
        vencimientoPreparacion
        vencimientoTransporte
        vencimientoRecepcion
        motivoModificacionPreTransferencia
        motivoModificacionPreparacion
        motivoModificacionTransporte
        motivoModificacionRecepcion
        motivoRechazoPreTransferencia
        motivoRechazoPreparacion
        motivoRechazoTransporte
        motivoRechazoRecepcion
        activo
        etapa
        poseeVencimiento
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

export const deleteTransferenciaItemDetalleQuery = gql`
  mutation deleteTransferenciaItemDetalle($id: ID!) {
    deleteTransferenciaItemDetalle(id: $id)
  }
`;
