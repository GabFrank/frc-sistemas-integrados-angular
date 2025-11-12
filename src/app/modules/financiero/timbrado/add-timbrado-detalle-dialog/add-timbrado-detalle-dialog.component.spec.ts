/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AddTimbradoDetalleDialogComponent } from './add-timbrado-detalle-dialog.component';

describe('AddTimbradoDetalleDialogComponent', () => {
  let component: AddTimbradoDetalleDialogComponent;
  let fixture: ComponentFixture<AddTimbradoDetalleDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddTimbradoDetalleDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTimbradoDetalleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
