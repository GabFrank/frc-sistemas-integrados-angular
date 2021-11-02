import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntradaDialogComponent } from './entrada-dialog.component';

describe('EntradaDialogComponent', () => {
  let component: EntradaDialogComponent;
  let fixture: ComponentFixture<EntradaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntradaDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntradaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
