import { Component, OnInit, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EChartsOption } from 'echarts';
import { BehaviorSubject, combineLatest, forkJoin, map, Observable, startWith, switchMap, tap } from 'rxjs';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../empresarial/sucursal/sucursal.service';
import { GraficoService } from '../grafico.service';

@Component({
  selector: 'ingreso-gasto',
  templateUrl: './ingreso-gasto.component.html',
  styleUrls: ['./ingreso-gasto.component.scss']
})
export class IngresoGastoComponent implements OnInit {

  private graficoService = inject(GraficoService);
  private sucursalService = inject(SucursalService);

  sucursalControl = new FormControl<number | null>(null);
  yearControl = new FormControl(new Date().getFullYear());

  sucursales$: Observable<Sucursal[]>;
  years: number[] = [];

  echartsOption: EChartsOption;
  cargando = false;
  hasData = false;

  mesesLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.years.push(i);
    }

    this.sucursales$ = this.sucursalService.onGetAllSucursales(true);
    this.cargarDatos();

    this.sucursalControl.valueChanges.subscribe(() => this.cargarDatos());
    this.yearControl.valueChanges.subscribe(() => this.cargarDatos());
  }

  cargarDatos() {
    this.cargando = true;
    const year = this.yearControl.value || new Date().getFullYear();
    const sucId = this.sucursalControl.value || undefined;

    forkJoin({
      ingresos: this.graficoService.obtenerVentasPorMes(year, sucId),
      gastos: this.graficoService.obtenerGastosPorMes(year, sucId)
    }).subscribe(({ ingresos, gastos }) => {
      this.configurarGrafico(ingresos || [], gastos || []);
      this.cargando = false;
    });
  }

  configurarGrafico(ingresos: any[], gastos: any[]) {
    // Map data to 12 months array (0-11)
    const ingresosData = new Array(12).fill(0);
    const efvoData = new Array(12).fill(0);
    const tarjetaData = new Array(12).fill(0);
    const otrosData = new Array(12).fill(0);
    const gastosData = new Array(12).fill(0);

    // ingresos/gastos return { mes: 1..12, total: number, efvo: number, ... }
    ingresos.forEach(item => {
      if (item.mes >= 1 && item.mes <= 12) {
        ingresosData[item.mes - 1] = item.total;
        efvoData[item.mes - 1] = item.efvo || 0;
        tarjetaData[item.mes - 1] = item.tarjeta || 0;
        otrosData[item.mes - 1] = item.otros || 0;
      }
    });

    gastos.forEach(item => {
      if (item.mes >= 1 && item.mes <= 12) {
        gastosData[item.mes - 1] = item.total;
      }
    });

    this.hasData = ingresosData.some(v => v > 0) || gastosData.some(v => v > 0);

    this.echartsOption = {
      title: {
        text: 'Ingresos vs Gastos Mensual',
        left: 'center',
        textStyle: { color: '#E0E0E0', fontSize: 18 }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          let tooltip = `<strong>${params[0].name}</strong><br/>`;
          let totalIngresos = 0;
          let breakdown = '';
          
          params.forEach((p: any) => {
            if (p.seriesName !== 'Gastos' && p.seriesName !== 'Total Ingresos') {
              totalIngresos += p.value;
              breakdown += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${p.color};"></span> ${p.seriesName}: ₲ ${p.value.toLocaleString('es-PY')}<br/>`;
            } else if (p.seriesName === 'Gastos') {
              tooltip += `${p.marker} <strong>${p.seriesName}: ₲ ${p.value.toLocaleString('es-PY')}</strong><br/>`;
            }
          });
          
          tooltip += `<hr style="border:0;border-top:1px solid #666;margin:5px 0">`;
          tooltip += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#689F38;"></span> <strong>Total Ingresos: ₲ ${totalIngresos.toLocaleString('es-PY')}</strong><br/>`;
          tooltip += `<div style="padding-left:15px; font-size: 0.9em; color: #ccc">${breakdown}</div>`;
          
          return tooltip;
        }
      },
      legend: {
        data: ['Efectivo', 'Tarjeta', 'Otros Ingresos', 'Gastos'],
        bottom: 10,
        textStyle: { color: '#9E9E9E' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: this.mesesLabels,
        axisLabel: { color: '#9E9E9E' }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#9E9E9E',
          formatter: (value: number) => {
            if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
            if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M';
            if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
            return value.toLocaleString('es-PY');
          }
        },
        splitLine: {
          lineStyle: { color: '#444' }
        }
      },
      series: [
        {
          name: 'Efectivo',
          type: 'bar',
          stack: 'ingresos',
          data: efvoData,
          itemStyle: { color: '#689F38' }
        },
        {
          name: 'Tarjeta',
          type: 'bar',
          stack: 'ingresos',
          data: tarjetaData,
          itemStyle: { color: '#A2C183' }
        },
        {
          name: 'Otros Ingresos',
          type: 'bar',
          stack: 'ingresos',
          data: otrosData,
          itemStyle: { color: '#C5E1A5' }
        },
        {
          name: 'Gastos',
          type: 'bar',
          data: gastosData,
          itemStyle: { color: '#F44336', borderRadius: [4, 4, 0, 0] }
        }
      ]
    };
  }
}
