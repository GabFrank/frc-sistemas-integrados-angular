import gql from 'graphql-tag';

export const deliverysQuery = gql`
  query {
    data: deliverys {
      id
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
      }
    }
  }
`;

export const deliverysSubsUltimos10Query = gql`
  subscription deliverys {
    deliverys{
      id
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
      }
    }
  }
`;

export const deliverysUltimos10Query = gql`
  query {
    data: deliverysUltimos10 {
      id
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
      }
    }
  }
`;

export const deliverysSearch = gql`
  query ($texto: String) {
    data: deliverySearch(texto: $texto) {
      id
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
      }
    }
  }
`;

export const deliverysByEstado = gql`
  query ($estado: DeliveryEstado) {
    data: deliverysByEstado(estado: $estado) {
      id
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
      }
    }
  }
`;

export const deliverysByEstadoList = gql`
  query deliverysByEstadoList($estadoList: [DeliveryEstado], $sucId: ID) {
    data: deliverysByEstadoList(estadoList: $estadoList, sucId: $sucId) {
      id
      creadoEn
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
        valor
      }
      valor
      venta {
        id
        cobro {
          id
          cobroDetalleList {
            id
            pago
            vuelto
            descuento
            aumento
            sucursalId
            moneda {
              id
              denominacion
              simbolo
              cambio
            }
            formaPago {
              id
              descripcion
            }
            valor
          }
        }
        ventaItemList {
          producto {
            id
            descripcion
          }
          presentacion {
            id
            cantidad
          }
          cantidad
          precio
          valorDescuento
          precioVenta {
            tipoPrecio {
              descripcion
            }
          }
          sucursalId
        }
        cliente {
          persona {
            id
            nombre
          }
        }
        valorTotal
      }
    }
  }
`;

export const deliveryPorCajaIdAndEstadoQuery = gql`
  query deliveryPorCajaIdAndEstados($id: ID!, $estadoList: [DeliveryEstado]!) {
    data: deliveryPorCajaIdAndEstados(id: $id, estadoList: $estadoList) {
      id
      creadoEn
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
        valor
      }
      valor
    }
  }
`;



export const deliverysByEstadoNotIn = gql`
  query ($estado: DeliveryEstado) {
    data: deliverysByEstadoNotIn(estado: $estado) {
      id
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
      }
    }
  }
`;

export const deliveryQuery = gql`
  query ($id: ID!) {
    data: delivery(id: $id) {
      id
      precio {
        id
        valor
      }
      venta {
        id
        sucursalId
        caja {
          id
        }
        cliente {
          id
          persona {
            id
            nombre
          }
        }
        formaPago {
          id
        }
        estado
        creadoEn
        usuario {
          id
        }
        valorDescuento
        valorTotal
        totalGs
        totalRs
        totalDs
        delivery {
          id
        }
        ventaItemList {
          id
          sucursalId
          venta {
            id
          }
          producto {
            id
          }
          presentacion {
            id
          }
          cantidad
          precioCosto
          precioVenta {
            id
          }
          precio
          valorDescuento
          unidadMedida
          creadoEn
          usuario {
            id
          }
          valorTotal
        }
        valorDescuento
        valorTotal
        totalGs
        totalRs
        totalDs
        cobro {
          id
          cobroDetalleList {
            id
            pago
            vuelto
            descuento
            aumento
            sucursalId
            moneda {
              id
              denominacion
              simbolo
              cambio
            }
            formaPago {
              id
              descripcion
            }
            valor
          }
        }
      }
      entregador {
        id
        persona {
          nombre
        }
      }
      vehiculo
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
        descripcion
        precioDelivery {
          valor
        }
      }
      precio {
        id
      }
      sucursalId
    }
  }
`;

export const saveDelivery = gql`
  mutation saveDelivery($entity: DeliveryInput!) {
    data: saveDelivery(delivery: $entity) {
      id
      precio {
        id
        valor
      }
      venta {
        id
        sucursalId
        caja {
          id
        }
        cliente {
          id
          persona {
            id
            nombre
          }
        }
        formaPago {
          id
        }
        estado
        creadoEn
        usuario {
          id
        }
        valorDescuento
        valorTotal
        totalGs
        totalRs
        totalDs
        cobro {
          id
        }
        delivery {
          id
        }
        ventaItemList {
          id
          sucursalId
          venta {
            id
          }
          producto {
            id
          }
          presentacion {
            id
          }
          cantidad
          precioCosto
          precioVenta {
            id
          }
          precio
          valorDescuento
          unidadMedida
          creadoEn
          usuario {
            id
          }
          valorTotal
        }
        valorDescuento
        valorTotal
        totalGs
        totalRs
        totalDs
        cobro {
          id
          cobroDetalleList {
            id
            pago
            vuelto
            descuento
            aumento
            sucursalId
            moneda {
              id
              denominacion
              simbolo
              cambio
            }
            formaPago {
              id
              descripcion
            }
            valor
          }
        }
      }
      entregador {
        id
        persona {
          nombre
        }
      }
      vehiculo
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
        descripcion
        precioDelivery {
          valor
        }
      }
      precio {
        id
      }
      sucursalId
    }
  }
`;

export const saveDeliveryAndVentaQuery = gql`
  mutation saveDeliveryAndVenta($deliveryInput:DeliveryInput!, $ventaInput:VentaInput, $ventaItemInputList:[VentaItemInput], $cobroInput:CobroInput, $cobroDetalleInputList:[CobroDetalleInput]) {
    data: saveDeliveryAndVenta(deliveryInput: $deliveryInput, ventaInput: $ventaInput, ventaItemInputList: $ventaItemInputList, cobroInput: $cobroInput, cobroDetalleInputList: $cobroDetalleInputList) {
      id
      entregador {
        id
        persona {
          nombre
        }
      }
      direccion
      telefono
      creadoEn
      usuario {
        id
        persona {
          nombre
        }
      }
      estado
      valor
      barrio {
        id
      }
      precio {
        id
      }
      venta {
        id
        sucursalId
        caja {
          id
        }
        cliente {
          id
          persona {
            id
            nombre
          }
        }
        formaPago {
          id
        }
        estado
        creadoEn
        usuario {
          id
        }
        valorDescuento
        valorTotal
        totalGs
        totalRs
        totalDs
        cobro {
          id
        }
        delivery {
          id
        }
        ventaItemList {
          id
          sucursalId
          venta {
            id
          }
          producto {
            id
            descripcion
          }
          presentacion {
            id
            cantidad
          }
          cantidad
          precioCosto
          precioVenta {
            id
          }
          precio
          valorDescuento
          unidadMedida
          creadoEn
          usuario {
            id
          }
          valorTotal
          precioVenta {
            tipoPrecio {
              descripcion
            }
          }
        }
        cobro {
          id
          cobroDetalleList {
            id
            pago
            vuelto
            descuento
            aumento
            sucursalId
            moneda {
              id
              denominacion
              cambio
            }
            valor
          }
        }
        valorDescuento
        valorTotal
        totalGs
        totalRs
        totalDs
      }
    }
  }
`;

export const deleteDeliveryQuery = gql`
  mutation deleteDelivery($id: ID!) {
    deleteDelivery(id: $id)
  }
`;

export const saveDeliveryEstadoQuery = gql`
  mutation saveDeliveryEstado($deliveryId: Int!, $deliveryEstado: DeliveryEstado!, $printerName: String, $local: String, $pdvId: Int) {
    data: saveDeliveryEstado(deliveryId: $deliveryId, deliveryEstado: $deliveryEstado, printerName: $printerName, local: $local, pdvId: $pdvId){
      estado
    }
  }
`;

export const reimprimirDeliveryQuery = gql`
  query reimprimirDelivery($id: Int!, $printerName: String, $local: String) {
    data: reimprimirDelivery(id: $id, printerName: $printerName, local: $local)
  }
`;