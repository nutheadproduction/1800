import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-anno-icon',
  template: '',
  styleUrls: ['./anno-icon.component.sass'],
  host: {
    // "[style.backgroundImage]"=""
  }
})
export class AnnoIconComponent implements OnInit {

  @Input() icon: string = "SunkenTreasures";

  constructor() { }

  ngOnInit(): void {
  }

}
