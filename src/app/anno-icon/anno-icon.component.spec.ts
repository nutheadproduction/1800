import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnoIconComponent } from './anno-icon.component';

describe('AnnoIconComponent', () => {
  let component: AnnoIconComponent;
  let fixture: ComponentFixture<AnnoIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnnoIconComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnoIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
