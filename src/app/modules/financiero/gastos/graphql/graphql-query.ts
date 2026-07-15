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
      preGasto {
        id
        sucursalId
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
      preGasto {
        id
        sucursalId
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
      preGasto {
        id
        sucursalId
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
        sucursalId
        sucursal {
          id
          nombre
        }
        caja {
          id
          sucursalId
        }
        responsable {
          id
          persona {
            nombre
          }
        }
        tipoGasto {
          id
          descripcion
        }
        autorizadoPor {
          id
          persona {
            nombre
          }
        }
        usuario {
          id
        }
        preGasto {
          id
          sucursalId
          estado
          estadoEtiqueta
          estadoIcono
          estadoColor
          tipoGasto {
            descripcion
          }
        }
        observacion
        retiroGs
        retiroRs
        retiroDs
        vueltoGs
        vueltoRs
        vueltoDs
        activo
        finalizado
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
      activoEnSucursales
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
      activoEnSucursales
      tipoNaturaleza
      moduloPadre
      afectaFinanzasActivo
      esPagoCuotaActivo
      cargo {
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

export const modulosGastoQuery = gql`
  query {
    data: modulosGasto {
      valor
      etiqueta
      grupo
      esServicioContinuo
      tieneCuotasActivo
      requiereEnteActivo
      tipoEnteEsperado
      diaVencimientoEnContinuo
      lecturaMedidorEnContinuo
      nisEnContinuo
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
      activoEnSucursales
      moduloPadre
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
      activoEnSucursales
      tipoNaturaleza
      moduloPadre
      afectaFinanzasActivo
      esPagoCuotaActivo
      cargo {
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
  mutation autorizarPreGasto($id: ID!, $autorizadorId: ID!, $usuarioId: ID, $sucId: ID) {
    data: autorizarPreGasto(id: $id, autorizadorId: $autorizadorId, usuarioId: $usuarioId, sucId: $sucId) {
      id
      sucursalId
      estado
    }
  }
`;

export const rechazarPreGastoMutation = gql`
  mutation rechazarPreGasto($id: ID!, $motivo: String!, $rechazadorId: ID, $usuarioId: ID, $sucId: ID) {
    data: rechazarPreGasto(id: $id, motivo: $motivo, rechazadorId: $rechazadorId, usuarioId: $usuarioId, sucId: $sucId) {
      id
      sucursalId
      estado
    }
  }
`;

export const completarPreGastoMutation = gql`
  mutation completarPreGasto(
    $id: ID!,
    $sucId: ID,
    $rindioGasto: Boolean,
    $montoGastado: Float,
    $montoGastadoGs: Float,
    $montoGastadoRs: Float,
    $montoGastadoDs: Float
  ) {
    data: completarPreGasto(
      id: $id,
      sucId: $sucId,
      rindioGasto: $rindioGasto,
      montoGastado: $montoGastado,
      montoGastadoGs: $montoGastadoGs,
      montoGastadoRs: $montoGastadoRs,
      montoGastadoDs: $montoGastadoDs
    ) {
      id
      sucursalId
      estado
      rindioGasto
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
  query ($id: ID, $cajaId: ID, $estado: String, $estados: [String], $inicio: String, $fin: String, $page: Int, $size: Int) {
    data: filterPreGastos(id: $id, cajaId: $cajaId, estado: $estado, estados: $estados, inicio: $inicio, fin: $fin, page: $page, size: $size) {
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
          moduloPadre
        }
        ente {
          id
          tipoEnte
          referenciaId
          descripcion
        }
        descripcion
        moneda {
          id
          denominacion
          simbolo
        }
        montoSolicitado
        cajaId
        gastoCajaRegistroId
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
        montoPendienteRetiro
        montoNoRendido
        porcentajeRendicion
        desvioVsSolicitado
        estadoEtiqueta
        estadoIcono
        estadoColor
        solicitudPagoId
        rindioGasto
        estadoRendicion
        fechaRendicion
        finanzas {
          id
          monto
          moneda {
            id
            denominacion
            simbolo
          }
        }
        gasto {
          retiroGs
          retiroRs
          retiroDs
          vueltoGs
          vueltoRs
          vueltoDs
        }
        rendiciones {
          id
          montoTotal
          fotoFacturaUrl
          fotoProductoUrl
          fotosFacturaUrls
          fotosProductoUrls
          kmActual
          litros
          precioPorLitro
          ubicacionProvisoria
          establecimientoAlimentacion
          creadoEn
          tipoGasto { descripcion }
        }
        creadoEn
      }
    }
  }
`;

export const filterTipoGastosQuery = gql`
  query ($naturaleza: String, $texto: String, $moduloPadre: TipoPadreGastoModulo, $page: Int, $size: Int) {
    data: filterTipoGastos(naturaleza: $naturaleza, texto: $texto, moduloPadre: $moduloPadre, page: $page, size: $size) {
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
        activoEnSucursales
        tipoNaturaleza
        moduloPadre
        afectaFinanzasActivo
        esPagoCuotaActivo
        cargo {
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

export const preGastosParaRetiroQuery = gql`
  query ($sucursalCajaId: ID!) {
    data: preGastosParaRetiro(sucursalCajaId: $sucursalCajaId) {
      id
      sucursalId
      descripcion
      estado
      montoSolicitado
      montoRetirado
      montoGastado
      saldoDevolver
      qrToken
      retiroConfirmadoEn
      funcionario { id nombre }
      autorizadoPor { id nombre }
      tipoGasto { id descripcion moduloPadre }
      moneda { id simbolo denominacion }
      finanzas { monto moneda { id simbolo denominacion } }
    }
  }
`;

export const qrRetiroPreGastoQuery = gql`
  query ($preGastoId: ID!, $sucursalId: ID!) {
    data: qrRetiroPreGasto(preGastoId: $preGastoId, sucursalId: $sucursalId) {
      codigoQr
      preGastoId
      sucursalId
      qrToken
    }
  }
`;

export const preGastoPorIdQuery = gql`
  query ($id: ID!, $sucId: ID) {
    data: preGasto(id: $id, sucId: $sucId) {
      id
      sucursalId
      descripcion
      estado
      montoSolicitado
      montoRetirado
      montoGastado
      saldoDevolver
      estadoEtiqueta
      estadoRendicion
      qrToken
      retiroConfirmadoEn
      funcionario { id nombre }
      tipoGasto { id descripcion moduloPadre }
      moneda { id simbolo denominacion }
      finanzas { monto moneda { id simbolo denominacion } }
      rendiciones {
        id
        montoTotal
        fotoFacturaUrl
        fotoProductoUrl
        fotosFacturaUrls
        fotosProductoUrls
        kmActual
        litros
        precioPorLitro
        ubicacionProvisoria
        establecimientoAlimentacion
        creadoEn
        tipoGasto { descripcion }
      }
    }
  }
`;

export const confirmarRetiroFuncionarioMutation = gql`
  mutation ($input: ConfirmarRetiroFuncionarioInput!) {
    data: confirmarRetiroFuncionarioPreGasto(input: $input) {
      id
      sucursalId
      estado
      retiroConfirmadoEn
    }
  }
`;

export const lineasRetiroSugeridasQuery = gql`
  query ($preGastoId: ID!, $sucursalId: ID!) {
    data: lineasRetiroSugeridas(preGastoId: $preGastoId, sucursalId: $sucursalId) {
      monedaId
      monto
    }
  }
`;

export const montosRetiroDesdeLineasQuery = gql`
  query ($lineas: [RetiroPreGastoLineaInput!]!) {
    data: montosRetiroDesdeLineas(lineas: $lineas) {
      retiroGs
      retiroRs
      retiroDs
    }
  }
`;

export const preGastoRetiroConfirmadoQuery = gql`
  query ($preGastoId: ID!, $sucursalId: ID!) {
    data: preGastoRetiroConfirmado(preGastoId: $preGastoId, sucursalId: $sucursalId)
  }
`;

export const ejecutarRetiroPreGastoMutation = gql`
  mutation ($input: EjecutarRetiroPreGastoInput!) {
    data: ejecutarRetiroPreGasto(input: $input) {
      id
      sucursalId
      estado
      montoRetirado
      saldoDevolver
    }
  }
`;

export const registrarDevolucionSaldoMutation = gql`
  mutation ($input: DevolucionSaldoPreGastoInput!) {
    data: registrarDevolucionSaldoPreGasto(input: $input) {
      id
      sucursalId
      saldoDevolver
      estado
    }
  }
`;

export const saveGastoRendicionMutation = gql`
  mutation ($input: GastoRendicionInput!) {
    data: saveGastoRendicion(input: $input) {
      id
      montoTotal
      creadoEn
    }
  }
`;

export const gastoRendicionesByPreGastoQuery = gql`
  query ($preGastoId: ID!, $sucursalId: ID!) {
    data: gastoRendicionesByPreGasto(preGastoId: $preGastoId, sucursalId: $sucursalId) {
      id
      montoTotal
      fotoFacturaUrl
      fotoProductoUrl
      fotosFacturaUrls
      fotosProductoUrls
      kmActual
      litros
      precioPorLitro
      ubicacionProvisoria
      establecimientoAlimentacion
      creadoEn
      tipoGasto { id descripcion }
    }
  }
`;
