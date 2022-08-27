import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnoSplitComponent } from './anno-split.component';

describe('AnnoSplitComponent', () => {
  let component: AnnoSplitComponent;
  let fixture: ComponentFixture<AnnoSplitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnnoSplitComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnoSplitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
