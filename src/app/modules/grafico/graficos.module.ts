import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { GraficosComponent } from './graficos/graficos.component';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { NgxEchartsModule } from 'ngx-echarts';
import { GraficosRoutingModule } from './graficos-routing.module';

import { VentaFuncionarioComponent } from './venta-funcionario/venta-funcionario.component';
import { FormaPagoComponent } from './forma-pago/forma-pago.component';
import { ProductoVendidoComponent } from './producto-vendido/producto-vendido.component';
import { VentasDiasComponent } from './ventas-dias/ventas-dias.component';
import { GastoCategoriaComponent } from './gasto-categoria/gasto-categoria.component';
import { IngresoGastoComponent } from './ingreso-gasto/ingreso-gasto.component';
import { VentaSucursalComponent } from './venta-sucursal/venta-sucursal.component';
// DESHABILITADO: Componente de ventas mensuales no se utiliza
// import { VentaMesComponent } from './venta-mes/venta-mes.component';

export function loadEcharts() {
    return import('echarts/core').then(echarts => {
        return Promise.all([
            import('echarts/charts'),
            import('echarts/components'),
            import('echarts/renderers')
        ]).then(([charts, components, renderers]) => {
            echarts.use([
                components.TitleComponent,
                components.TooltipComponent,
                components.GridComponent,
                components.LegendComponent,
                charts.PieChart,
                charts.BarChart,
                charts.LineChart,
                renderers.CanvasRenderer
            ]);
            return echarts;
        });
    });
}

@NgModule({
    declarations: [
        GraficosComponent,
        VentaFuncionarioComponent,
        FormaPagoComponent,
        ProductoVendidoComponent,
        VentasDiasComponent,
        GastoCategoriaComponent,
        IngresoGastoComponent,
        VentaSucursalComponent,
        // VentaMesComponent // DESHABILITADO
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MaterialModule,
        SharedModule,
        GraficosRoutingModule,
        NgxEchartsModule.forRoot({
            echarts: loadEcharts
        })
    ]
})
export class GraficosModule { }
