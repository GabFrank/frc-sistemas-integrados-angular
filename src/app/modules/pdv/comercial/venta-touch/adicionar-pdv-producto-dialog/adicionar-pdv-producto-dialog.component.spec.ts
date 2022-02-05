import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarPdvProductoDialogComponent } from './adicionar-pdv-producto-dialog.component';

describe('AdicionarPdvProductoDialogComponent', () => {
  let component: AdicionarPdvProductoDialogComponent;
  let fixture: ComponentFixture<AdicionarPdvProductoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarPdvProductoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarPdvProductoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
