import { Component } from '@angular/core';

interface ManualSeccion {
  icon: string;
  titulo: string;
  paraQue: string;
  pasos: string[];
  tip?: string;
}

interface ManualCategoria {
  nombre: string;
  icon: string;
  secciones: ManualSeccion[];
}

@Component({
  selector: 'app-manual-rrhh',
  templateUrl: './manual-rrhh.component.html',
  styleUrls: ['./manual-rrhh.component.scss']
})
export class ManualRrhhComponent {

  categorias: ManualCategoria[] = [
    {
      nombre: 'Personal',
      icon: 'badge',
      secciones: [
        {
          icon: 'folder_shared',
          titulo: 'Legajo del funcionario',
          paraQue: 'Es la ficha completa de cada empleado: su cargo, su salario, sus documentos y su situación actual. Desde acá se hacen los cambios importantes de su carrera dentro de la empresa.',
          pasos: [
            'Entrá a R.R.H.H. → Legajo funcionario.',
            'Elegí al empleado con el buscador de arriba.',
            'Vas a ver su cargo y salario actuales, más el historial de cambios.',
            'Con los botones podés cambiarle el cargo, cambiarle el salario, subir un documento (contrato, cédula, carnet de salud, etc.) o darlo de baja.',
            'Para subir un documento: tocá "Subir documento", elegí el tipo y el archivo, y guardá.'
          ],
          tip: 'Cuando le cambiás el salario, el sistema te avisa si queda por debajo del mínimo legal y te pide confirmar.'
        },
        {
          icon: 'schedule',
          titulo: 'Historial de marcaciones',
          paraQue: 'Sirve para ver a qué hora entró y salió cada empleado, en un rango de fechas. Útil para revisar la asistencia.',
          pasos: [
            'Entrá a R.R.H.H. → Historial de marcaciones.',
            'Elegí el empleado y el rango de fechas que querés revisar.',
            'La lista te muestra las entradas y salidas.',
            'Si necesitás, podés imprimir el reporte.'
          ]
        }
      ]
    },
    {
      nombre: 'Asistencia',
      icon: 'event_available',
      secciones: [
        {
          icon: 'event',
          titulo: 'Feriados',
          paraQue: 'Es la lista de días feriados. El sistema la usa para saber cuándo una hora extra vale más (recargo de feriado).',
          pasos: [
            'Entrá a R.R.H.H. → Feriados.',
            'Tocá el botón para agregar un feriado nuevo con su fecha y nombre.',
            'Podés editar o quitar los que ya cargaste.'
          ]
        },
        {
          icon: 'event_note',
          titulo: 'Novedades (justificaciones)',
          paraQue: 'Sirve para justificar situaciones de la jornada: un permiso, una ausencia justificada, una vacación. Una novedad justificada evita que el empleado reciba una penalización por ese día.',
          pasos: [
            'Entrá a R.R.H.H. → Novedades.',
            'Agregá una novedad para el empleado, elegí el tipo y la fecha.',
            'Guardá. A partir de ahí ese día queda justificado.'
          ]
        },
        {
          icon: 'gavel',
          titulo: 'Penalizaciones',
          paraQue: 'Son los descuentos por llegar tarde. El sistema las genera solo cada día, revisando quién llegó tarde sin justificación.',
          pasos: [
            'Entrá a R.R.H.H. → Penalizaciones para ver las que se generaron.',
            'Si una penalización no corresponde, podés anularla.',
            'También podés justificar el día para que no se cobre.'
          ],
          tip: 'El sistema respeta unos minutos de tolerancia (configurables). Solo penaliza cuando la tardanza pasa ese margen.'
        },
        {
          icon: 'more_time',
          titulo: 'Horas extra',
          paraQue: 'Sirve para registrar las horas de más que trabajó un empleado. El sistema calcula solo cuánto valen según el tipo (día, noche o feriado).',
          pasos: [
            'Entrá a R.R.H.H. → Horas extra.',
            'Cargá las horas del empleado, con la fecha y el tipo.',
            'Al guardar, el monto se calcula automáticamente.',
            'Esas horas se suman después al sueldo del mes.'
          ]
        }
      ]
    },
    {
      nombre: 'Dinero para el empleado',
      icon: 'payments',
      secciones: [
        {
          icon: 'label',
          titulo: 'Motivos de vale',
          paraQue: 'Es la lista de razones por las que se puede pedir un vale (por ejemplo: adelanto, emergencia). Ayuda a ordenar y clasificar los vales.',
          pasos: [
            'Entrá a R.R.H.H. → Motivos de vale.',
            'Agregá o editá los motivos que uses habitualmente.'
          ]
        },
        {
          icon: 'request_quote',
          titulo: 'Vales / adelantos',
          paraQue: 'Es un adelanto de plata al empleado. Cuando lo confirmás, sale la plata de la caja; después se le descuenta cuando se le paga el sueldo.',
          pasos: [
            'Entrá a R.R.H.H. → Vales.',
            'Creá un vale para el empleado, con el monto y el motivo. Queda como "solicitado".',
            'Cuando lo confirmás, el sistema saca la plata de la Caja Mayor y lo registra a nombre del empleado.',
            'Ese vale se descuenta solo en la próxima liquidación de sueldo.'
          ],
          tip: 'El empleado también puede pedir un vale desde la app del celular; te llega como "solicitado" para que lo confirmes.'
        },
        {
          icon: 'account_balance_wallet',
          titulo: 'Préstamos',
          paraQue: 'Es un préstamo al empleado que se paga en varias cuotas. Podés cobrarlo directamente o descontarlo del sueldo.',
          pasos: [
            'Entrá a R.R.H.H. → Préstamos.',
            'Creá el préstamo indicando el monto total y en cuántas cuotas se paga.',
            'Al crearlo, sale el dinero de la Caja Mayor.',
            'Podés ver el plan de cuotas y cobrar una cuota cuando el empleado paga.',
            'Las cuotas también se pueden descontar automáticamente del sueldo.'
          ]
        }
      ]
    },
    {
      nombre: 'Beneficios',
      icon: 'card_giftcard',
      secciones: [
        {
          icon: 'beach_access',
          titulo: 'Vacaciones',
          paraQue: 'Sirve para llevar el control de los días de vacaciones que le corresponden a cada empleado, los que ya se tomó y los que se le pagaron.',
          pasos: [
            'Entrá a R.R.H.H. → Vacaciones.',
            'El sistema calcula solo los días que le corresponden según su antigüedad.',
            'Cuando el empleado se toma las vacaciones, marcás el período como "gozado".',
            'Si en vez de tomarlas se le pagan, podés registrar la venta de esos días.'
          ],
          tip: 'Los días de vacaciones tienen fecha de vencimiento. El sistema te avisa cuando están por prescribir.'
        },
        {
          icon: 'redeem',
          titulo: 'Aguinaldo',
          paraQue: 'Es el pago del aguinaldo (13.º salario). El sistema lo calcula automáticamente según lo trabajado en el año.',
          pasos: [
            'Entrá a R.R.H.H. → Aguinaldos.',
            'El sistema calcula el aguinaldo del año para cada empleado.',
            'Revisás y aprobás el monto.',
            'Ese aguinaldo se puede sumar al pago del sueldo.'
          ]
        },
        {
          icon: 'star',
          titulo: 'Bonos',
          paraQue: 'Sirve para darle un pago extra al empleado (por ejemplo, un premio o incentivo). Puede ser una sola vez o repetirse todos los meses.',
          pasos: [
            'Entrá a R.R.H.H. → Bonos.',
            'Creá el bono para el empleado con su monto.',
            'Indicá si es por única vez o recurrente.',
            'El bono se suma al sueldo del mes correspondiente.'
          ]
        }
      ]
    },
    {
      nombre: 'Pagos de sueldo',
      icon: 'receipt_long',
      secciones: [
        {
          icon: 'receipt',
          titulo: 'Liquidación de sueldo',
          paraQue: 'Es el cálculo del sueldo del mes. El sistema junta todo (salario, horas extra, bonos, aguinaldo, y los descuentos por vales, cuotas y penalizaciones) y saca cuánto cobra el empleado.',
          pasos: [
            'Entrá a R.R.H.H. → Liquidaciones.',
            'Generá la liquidación del período, para un empleado o para todos a la vez.',
            'Revisá el detalle: vas a ver los conceptos que suman y los que restan, y el neto a pagar.',
            'Aprobá la liquidación cuando esté correcta.',
            'Pagala eligiendo la Caja Mayor. Al pagar, se descuentan solos los vales y cuotas pendientes.',
            'Podés imprimir el recibo de sueldo para el empleado.'
          ],
          tip: 'Si un dato quedó mal, mientras esté aprobada podés volverla a borrador y regenerarla.'
        },
        {
          icon: 'logout',
          titulo: 'Liquidación final (finiquito)',
          paraQue: 'Es el pago final cuando un empleado deja la empresa. El sistema calcula la antigüedad, la indemnización (si corresponde), las vacaciones no tomadas y el aguinaldo proporcional.',
          pasos: [
            'Entrá al Legajo del funcionario y tocá "Liquidación final".',
            'Elegí el motivo de la salida y la fecha.',
            'El sistema muestra el desglose y el total a pagar.',
            'Aprobá y pagá desde la Caja Mayor. El empleado queda inactivo.',
            'Podés imprimir el recibo del finiquito.'
          ]
        }
      ]
    },
    {
      nombre: 'Seguimiento y ajustes',
      icon: 'insights',
      secciones: [
        {
          icon: 'dashboard',
          titulo: 'Panel (Dashboard)',
          paraQue: 'Es un resumen rápido del mes: cuánta gente activa hay, cuánto suma la nómina, cuántos vales y préstamos hay abiertos, cumpleaños del mes, vacaciones por vencer y más.',
          pasos: [
            'Entrá a R.R.H.H. → Dashboard RRHH.',
            'Elegí el período que querés ver.',
            'Cada tarjeta te muestra un número importante de un vistazo.'
          ]
        },
        {
          icon: 'summarize',
          titulo: 'Reportes',
          paraQue: 'Sirve para generar informes en PDF para imprimir o archivar: la nómina del mes, el resumen de IPS, los vales pendientes, los préstamos activos y el aguinaldo del año.',
          pasos: [
            'Entrá a R.R.H.H. → Reportes RRHH.',
            'Para los reportes del mes, escribí el período.',
            'Tocá "Generar PDF" en el reporte que necesites.',
            'Se abre el PDF listo para imprimir o guardar.'
          ]
        },
        {
          icon: 'settings',
          titulo: 'Configuración',
          paraQue: 'Son los parámetros que usa el módulo para sus cálculos: porcentajes de IPS, recargos de horas extra, días de vacaciones, tolerancia de tardanza, días de aviso, etc.',
          pasos: [
            'Entrá a R.R.H.H. → Configuración RRHH.',
            'Cada parámetro tiene un botón de información que explica para qué sirve y da un ejemplo.',
            'Cambiá el valor solo si sabés qué afecta.'
          ],
          tip: 'Esta pantalla la maneja normalmente el encargado. Un cambio acá afecta los cálculos de todos.'
        }
      ]
    },
    {
      nombre: 'App del empleado',
      icon: 'smartphone',
      secciones: [
        {
          icon: 'phone_android',
          titulo: 'Mis RRHH (en el celular)',
          paraQue: 'Es lo que el empleado ve en su celular: su saldo de vacaciones, sus vales, sus recibos y sus marcaciones. También puede pedir un vale o pedir vacaciones.',
          pasos: [
            'El empleado abre la app "Bodega Franco" y entra a "Mis RRHH".',
            'Ve su resumen y puede tocar cada sección (recibos, vales, vacaciones, marcaciones).',
            'Puede ver el recibo de sueldo en PDF.',
            'Puede solicitar un vale o vacaciones; quedan pendientes de aprobación.'
          ]
        },
        {
          icon: 'how_to_reg',
          titulo: 'Aprobaciones (para encargados)',
          paraQue: 'Sirve para que un encargado apruebe desde el celular las vacaciones que pidió el personal.',
          pasos: [
            'El encargado entra a "Aprobaciones" en la app (necesita el permiso correspondiente).',
            'Ve las vacaciones pendientes y las aprueba.',
            'Los vales pendientes se ven, pero se confirman desde el sistema de escritorio (porque mueven la caja).'
          ]
        }
      ]
    }
  ];
}
