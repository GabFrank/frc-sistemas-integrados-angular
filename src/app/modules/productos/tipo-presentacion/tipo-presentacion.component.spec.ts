import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoPresentacionComponent } from './tipo-presentacion.component';

describe('TipoPresentacionComponent', () => {
  let component: TipoPresentacionComponent;
  let fixture: ComponentFixture<TipoPresentacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TipoPresentacionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TipoPresentacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
