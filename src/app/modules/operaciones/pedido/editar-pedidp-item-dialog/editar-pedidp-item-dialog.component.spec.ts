import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarPedidpItemDialogComponent } from './editar-pedidp-item-dialog.component';

describe('EditarPedidpItemDialogComponent', () => {
  let component: EditarPedidpItemDialogComponent;
  let fixture: ComponentFixture<EditarPedidpItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditarPedidpItemDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarPedidpItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
