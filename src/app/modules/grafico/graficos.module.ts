import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { GraficosComponent } from './graficos/graficos.component';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { PieChart, BarChart, LineChart } from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent,
    PieChart,
    BarChart,
    LineChart,
    CanvasRenderer
]);

import { VentaFuncionarioComponent } from './venta-funcionario/venta-funcionario.component';
import { FormaPagoComponent } from './forma-pago/forma-pago.component';
import { ProductoVendidoComponent } from './producto-vendido/producto-vendido.component';
import { VentaMesComponent } from './venta-mes/venta-mes.component';

@NgModule({
    declarations: [
        GraficosComponent,
        VentaFuncionarioComponent,
        FormaPagoComponent,
        ProductoVendidoComponent,
        VentaMesComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MaterialModule,
        SharedModule,
        NgxEchartsModule.forRoot({
            echarts
        })
    ],
    exports: [
        GraficosComponent
    ]
})
export class GraficosModule { }
