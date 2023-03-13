import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurarServidorDialogComponent } from './configurar-servidor-dialog.component';

describe('ConfigurarServidorDialogComponent', () => {
  let component: ConfigurarServidorDialogComponent;
  let fixture: ComponentFixture<ConfigurarServidorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfigurarServidorDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigurarServidorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
