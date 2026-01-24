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
      etapa
      observacion
      creadoEn
      usuarioPreTransferencia {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const transferenciaQuery = gql`
  query ($id: Int!) {
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
      etapa
      observacion
      creadoEn
      usuarioPreTransferencia {
        id
        persona {
          nombre
        }
      }
      usuarioPreparacion {
        id
        persona {
          nombre
        }
      }
      usuarioTransporte {
        id
        persona {
          nombre
        }
      }
      usuarioRecepcion {
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
        poseeVencimiento
        creadoEn
      }
    }
  }
`;

export const transferenciasPorUsuarioQuery = gql`
  query ($id: Int!) {
    data: transferenciasPorUsuario(id: $id) {
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
      etapa
      observacion
      creadoEn
      usuarioPreTransferencia {
        id
        persona {
          nombre
        }
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
      etapa
      observacion
      creadoEn
      usuarioPreTransferencia {
        id
        persona {
          nombre
        }
      }
      usuarioPreparacion {
        id
        persona {
          nombre
        }
      }
      usuarioTransporte {
        id
        persona {
          nombre
        }
      }
      usuarioRecepcion {
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
      etapa
      observacion
      creadoEn
      usuarioPreTransferencia {
        id
        persona {
          nombre
        }
      }
      usuarioPreparacion {
        id
        persona {
          nombre
        }
      }
      usuarioTransporte {
        id
        persona {
          nombre
        }
      }
      usuarioRecepcion {
        id
        persona {
          nombre
        }
      }
    }
  }
`;

export const imprimirTransferenciaQuery = gql`
  query ($id: ID!, $printerName: String!, $ticket: Boolean) {
    data: imprimirTransferencia(
      id: $id
      ticket: $ticket
      printerName: $printerName
    )
  }
`;

export const transferenciaWithFiltersQuery = gql`
  query (
    $sucursalOrigenId: Int
    $sucursalDestinoId: Int
    $estado: TransferenciaEstado
    $tipo: TipoTransferencia
    $etapa: EtapaTransferencia
    $isOrigen: Boolean
    $isDestino: Boolean
    $creadoDesde: String
    $creadoHasta: String
    $page: Int
    $size: Int
  ) {
    data: transferenciasWithFilters(
      sucursalOrigenId: $sucursalOrigenId
      sucursalDestinoId: $sucursalDestinoId
      estado: $estado
      tipo: $tipo
      etapa: $etapa
      isOrigen: $isOrigen
      isDestino: $isDestino
      creadoDesde: $creadoDesde
      creadoHasta: $creadoHasta
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
      getPageable {
        getPageNumber
        getPageSize
      }
      getContent {
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
        etapa
        observacion
        creadoEn
      }
    }
  }
`;

export const finalizarTransferencia = gql`
  mutation finalizarTransferencia($id: ID!, $usuarioId: ID!) {
    data: finalizarTransferencia(id: $id, usuarioId: $usuarioId)
  }
`;

export const prepararTransferencia = gql`
  mutation avanzarEtapaTransferencia(
    $id: ID!
    $etapa: EtapaTransferencia!
    $usuarioId: ID!
  ) {
    data: avanzarEtapaTransferencia(id: $id, etapa: $etapa, usuarioId: $usuarioId)
  }
`;

export const imprimirTransferencia = gql`
  query imprimirTransferencia($id: ID!) {
    data: imprimirTransferencia(id: $id)
  }
`;

export const saveTransferenciaItem = gql`
  mutation saveTransferenciaItem(
    $entity: TransferenciaItemInput!
    $precioCosto: Float
  ) {
    data: saveTransferenciaItem(
      transferenciaItem: $entity
      precioCosto: $precioCosto
    ) {
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
  mutation deleteTransferenciaItem($id: Int!) {
    data: deleteTransferenciaItem(id: $id)
  }
`;

export const saveTransferenciaItemDetalle = gql`
  mutation saveTransferenciaItemDetalle(
    $entity: TransferenciaItemDetalleInput!
  ) {
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
  mutation deleteTransferenciaItemDetalle($id: Int!) {
    data: deleteTransferenciaItemDetalle(id: $id)
  }
`;

export const transferenciaItemPorTransferenciaIdQuery = gql`
  query ($id: Int!, $page: Int, $size: Int) {
    data: transferenciaItensPorTransferenciaId(
      id: $id
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
      getPageable {
        getPageNumber
        getPageSize
      }
      getContent {
        id
        transferencia {
          id
        }
        presentacionPreTransferencia {
          id
          producto {
            id
            descripcion
            descripcionFactura
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
            descripcionFactura
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
        poseeVencimiento
        creadoEn
      }
    }
  }
`;

export const transferenciaItemQuery = gql`
  query ($id: Int!) {
    data: transferenciaItem(id: $id) {
      id
      transferencia {
        id
        sucursalOrigen {
          id
          nombre
        }
        sucursalDestino {
          id
          nombre
        }
      }
      presentacionPreTransferencia {
        id
        producto {
          id
          descripcion
          descripcionFactura
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
          descripcionFactura
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
      poseeVencimiento
      creadoEn
    }
  }
`;


export const transferenciaItensPorTransferenciaIdWithFilter = gql`
  query ($id: Int, $name: String, $page:Int = 0, $size:Int = 10) {
    data: transferenciaItensPorTransferenciaIdWithFilter(
      id: $id
      name: $name
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
      getPageable {
        getPageNumber
        getPageSize
      }
      getContent {
        id
        transferencia {
          id
        }
        presentacionPreTransferencia {
          id
          producto {
            id
            descripcion
            descripcionFactura
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
            descripcionFactura
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
        poseeVencimiento
        creadoEn
      }
    }
  }
`;

export const hojaRutaQuery = gql`
  query ($id: Int!) {
    data: hojaRuta(id: $id) {
      id
      vehiculo {
        id
        modelo {
          descripcion
        }
        chapa
      }
      chofer {
        id
        nombre
      }
      fechaSalida
      fechaLlegada
      kmSalida
      kmLlegada
      estado
      creadoEn
      acompanantes {
        id
        nombre
      }
    }
  }
`;

export const hojaRutaListQuery = gql`
  query ($page: Int, $size: Int) {
    data: hojaRutaList(page: $page, size: $size) {
      id
      vehiculo {
        id
        modelo {
          descripcion
        }
        chapa
      }
      chofer {
        id
        nombre
      }
      fechaSalida
      fechaLlegada
      kmSalida
      kmLlegada
      estado
      creadoEn
    }
  }
`;

export const hojaRutaPorVehiculoQuery = gql`
  query ($vehiculoId: Int!, $page: Int, $size: Int) {
    data: hojaRutaPorVehiculo(vehiculoId: $vehiculoId, page: $page, size: $size) {
      id
      vehiculo {
        id
        modelo {
          descripcion
        }
        chapa
      }
      chofer {
        id
        nombre
      }
      fechaSalida
      fechaLlegada
      kmSalida
      kmLlegada
      estado
      creadoEn
    }
  }
`;

export const hojaRutaPorChoferQuery = gql`
  query ($choferId: Int!, $page: Int, $size: Int) {
    data: hojaRutaPorChofer(choferId: $choferId, page: $page, size: $size) {
      id
      vehiculo {
        id
        modelo {
          descripcion
        }
        chapa
      }
      chofer {
        id
        nombre
      }
      fechaSalida
      fechaLlegada
      kmSalida
      kmLlegada
      estado
      creadoEn
    }
  }
`;

export const hojaRutaActivaPorVehiculoQuery = gql`
  query ($vehiculoId: Int!) {
    data: hojaRutaActivaPorVehiculo(vehiculoId: $vehiculoId) {
      id
      vehiculo {
        id
        modelo {
          descripcion
        }
        chapa
      }
      chofer {
        id
        nombre
      }
      fechaSalida
      fechaLlegada
      kmSalida
      kmLlegada
      estado
      creadoEn
    }
  }
`;

export const saveHojaRuta = gql`
  mutation saveHojaRuta($entity: HojaRutaInput!) {
    data: saveHojaRuta(input: $entity) {
      id
      vehiculo {
        id
        modelo {
          descripcion
        }
        chapa
      }
      chofer {
        id
        nombre
      }
      fechaSalida
      fechaLlegada
      kmSalida
      kmLlegada
      estado
      creadoEn
      acompanantes {
        id
        nombre
      }
    }
  }
`;

export const deleteHojaRuta = gql`
  mutation deleteHojaRuta($id: Int!) {
    data: deleteHojaRuta(id: $id)
  }
`;

export const acompanhantesPorHojaRutaQuery = gql`
  query ($hojaRutaId: Int!) {
    data: acompanhantesPorHojaRuta(hojaRutaId: $hojaRutaId) {
        id {
            hojaRutaId
            personaId
        }
        persona {
            id
            nombre
        }
    }
  }
`;

export const saveAcompanhante = gql`
  mutation saveAcompanhante($entity: AcompanhanteInput!) {
    data: saveAcompanhante(input: $entity) {
        id {
            hojaRutaId
            personaId
        }
        persona {
            id
            nombre
        }
    }
  }
`;

export const deleteAcompanhante = gql`
  mutation deleteAcompanhante($hojaRutaId: Int!, $personaId: Int!) {
    data: deleteAcompanhante(hojaRutaId: $hojaRutaId, personaId: $personaId)
  }
`;

export const hojasRutaConEntregasQuery = gql`
  query ($page: Int, $size: Int) {
    data: hojasRutaConEntregas(page: $page, size: $size) {
      id
      chofer {
        id
        nombre
      }
      vehiculo {
        id
        chapa
        modelo {
          descripcion
        }
      }
      fechaSalida
    }
  }
`;

export const transferenciasPorHojaRutaQuery = gql`
  query ($hojaRutaId: ID!, $page: Int!, $size: Int!) {
    data: transferenciasPorHojaRuta(hojaRutaId: $hojaRutaId, page: $page, size: $size) {
      id
      sucursalOrigen {
        id
        nombre
      }
      sucursalDestino {
        id
        nombre
      }
      estado
      fecha: creadoEn
      hojaRuta {
        id
        vehiculo {
          chapa
          modelo {
            descripcion
          }
        }
      }
    }
  }
`;



export const hojaRutaPorFechaQuery = gql`
  query ($inicio: String, $fin: String) {
    data: hojaRutaPorFecha(inicio: $inicio, fin: $fin) {
      id
      vehiculo {
        id
        modelo {
          descripcion
        }
        chapa
      }
      chofer {
        id
        nombre
      }
      fechaSalida
      fechaLlegada
      kmSalida
      kmLlegada
      estado
      creadoEn
      acompanantes {
        id
        nombre
      }
    }
  }
`;
