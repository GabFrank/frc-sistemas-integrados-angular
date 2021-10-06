import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarPrecioDialogComponent } from './adicionar-precio-dialog.component';

describe('AdicionarPrecioDialogComponent', () => {
  let component: AdicionarPrecioDialogComponent;
  let fixture: ComponentFixture<AdicionarPrecioDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarPrecioDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarPrecioDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
