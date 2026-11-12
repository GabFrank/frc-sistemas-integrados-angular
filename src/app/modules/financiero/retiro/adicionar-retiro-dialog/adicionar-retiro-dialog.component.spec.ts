import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { AdicionarRetiroDialogComponent } from './adicionar-retiro-dialog.component';
import { Retiro } from '../retiro.model';

// Sin TestBed: el constructor necesita la caja y varios servicios; onVer solo usa los controles.
describe('AdicionarRetiroDialogComponent.onVer (#728)', () => {
  it('carga reales en el control de reales y dólares en el de dólares', () => {
    const vista: any = {
      responsableControl: new FormControl(), observacionControl: new FormControl(),
      guaraniControl: new FormControl(), realControl: new FormControl(), dolarControl: new FormControl()
    };
    const retiro = Object.assign(new Retiro(), { retiroGs: 50000, retiroRs: 10, retiroDs: 20 });

    AdicionarRetiroDialogComponent.prototype.onVer.call(vista, retiro);

    expect(vista.guaraniControl.value).toBe(50000);
    expect(vista.realControl.value).toBe(10);
    expect(vista.dolarControl.value).toBe(20);
  });
});

describe('AdicionarRetiroDialogComponent', () => {
  let component: AdicionarRetiroDialogComponent;
  let fixture: ComponentFixture<AdicionarRetiroDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarRetiroDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarRetiroDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
