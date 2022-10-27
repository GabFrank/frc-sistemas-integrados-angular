import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitarRecursosDialogComponent } from './solicitar-recursos-dialog.component';

describe('SolicitarRecursosDialogComponent', () => {
  let component: SolicitarRecursosDialogComponent;
  let fixture: ComponentFixture<SolicitarRecursosDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SolicitarRecursosDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SolicitarRecursosDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
