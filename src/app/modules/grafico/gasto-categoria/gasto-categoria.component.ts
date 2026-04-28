import { Component, OnInit, inject } from '@angular/core';
import { GraficoService } from '../grafico.service';
import { DatePipe } from '@angular/common';
import { EChartsOption } from 'echarts';
import { FormControl } from '@angular/forms';
import { SucursalService } from '../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'gasto-categoria',
  templateUrl: './gasto-categoria.component.html',
  styleUrls: ['./gasto-categoria.component.scss']
})
export class GastoCategoriaComponent implements OnInit {

  private graficoService = inject(GraficoService);
  private sucursalService = inject(SucursalService);
  private datePipe = new DatePipe('en-US');

  sucursalControl = new FormControl(null);
  monthControl = new FormControl(new Date().getMonth() + 1);
  yearControl = new FormControl(new Date().getFullYear());

  sucursales$: Observable<Sucursal[]>;

  meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  years: number[] = [];

  echartsOption: EChartsOption;
  cargando = false;

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.years.push(i);
    }

    this.sucursales$ = this.sucursalService.onGetAllSucursales(true);

    this.cargarDatos();

    this.sucursalControl.valueChanges.subscribe(() => this.cargarDatos());
    this.monthControl.valueChanges.subscribe(() => this.cargarDatos());
    this.yearControl.valueChanges.subscribe(() => this.cargarDatos());
  }

  cargarDatos() {
    this.cargando = true;
    const year = this.yearControl.value || new Date().getFullYear();
    const month = (this.monthControl.value || (new Date().getMonth() + 1)) - 1;

    const inicio = new Date(year, month, 1);
    const fin = new Date(year, month + 1, 0);

    const inicioStr = this.datePipe.transform(inicio, 'yyyy-MM-dd') || '';
    const finStr = this.datePipe.transform(fin, 'yyyy-MM-dd') || '';

    const sucId = this.sucursalControl.value;

    this.graficoService.obtenerGastosPorCategoria(inicioStr, finStr, sucId).subscribe(res => {
      if (res) {
        this.configurarGrafico(res);
      }
      this.cargando = false;
    });
  }

  configurarGrafico(data: any[]) {

    const sortedData = [...data].sort((a, b) => a.total - b.total);

    const categories = sortedData.map(d => d.categoria || 'Sin Categoría');
    const values = sortedData.map(d => d.total);

    this.echartsOption = {
      title: {
        text: 'Gastos por Categoría',
        left: 'center',
        textStyle: { color: '#E0E0E0', fontSize: 18 }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/>Monto: ₲ ${p.value.toLocaleString('es-PY')}`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: '#9E9E9E',
          formatter: (value: number) => {
            if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M';
            if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
            return value.toString();
          }
        },
        splitLine: {
          lineStyle: { color: '#444' }
        }
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLabel: { color: '#E0E0E0', fontSize: 14 },
        axisTick: { alignWithLabel: true },
        splitLine: { show: false }
      },
      series: [
        {
          name: 'Total',
          type: 'bar',
          data: values,
          label: {
            show: true,
            position: 'right',
            formatter: (p: any) => {
              const val = p.value as number;
              if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
              return (val / 1000).toFixed(0) + 'k';
            },
            color: '#fff',
            fontWeight: 'bold'
          },
          itemStyle: {
            color: (params: any) => {
              const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
              return colors[params.dataIndex % colors.length];
            },
            borderRadius: [0, 4, 4, 0]
          },
          barWidth: '60%'
        }
      ]
    };
  }
}
