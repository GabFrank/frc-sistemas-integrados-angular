import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarCodigoDialogComponent } from './adicionar-codigo-dialog.component';

describe('AdicionarCodigoDialogComponent', () => {
  let component: AdicionarCodigoDialogComponent;
  let fixture: ComponentFixture<AdicionarCodigoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarCodigoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarCodigoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
