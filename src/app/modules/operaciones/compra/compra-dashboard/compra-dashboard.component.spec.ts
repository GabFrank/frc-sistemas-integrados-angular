import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompraDashboardComponent } from './compra-dashboard.component';

describe('CompraDashboardComponent', () => {
  let component: CompraDashboardComponent;
  let fixture: ComponentFixture<CompraDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompraDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompraDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
