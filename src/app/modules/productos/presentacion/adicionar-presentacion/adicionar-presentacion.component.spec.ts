import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarPresentacionComponent } from './adicionar-presentacion.component';

describe('AdicionarPresentacionComponent', () => {
  let component: AdicionarPresentacionComponent;
  let fixture: ComponentFixture<AdicionarPresentacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarPresentacionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarPresentacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
