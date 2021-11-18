import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuscarPersonaDialogComponent } from './buscar-persona-dialog.component';

describe('BuscarPersonaDialogComponent', () => {
  let component: BuscarPersonaDialogComponent;
  let fixture: ComponentFixture<BuscarPersonaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuscarPersonaDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BuscarPersonaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
