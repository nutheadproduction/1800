import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-anno-split',
  templateUrl: './anno-split.component.html',
  styleUrls: ['./anno-split.component.sass'],
  host: {
    "[class.transparentTop]": "!borderTop",
    "[class.transparentBottom]": "!borderBottom",
    "[class.fade]": "fade",
    "[class.noDia]": "!diamond",
  }
})
export class AnnoSplitComponent implements OnInit {

  @Input() fade: boolean = false;
  @Input() inset: boolean = true;
  @Input() small: boolean = false;
  @Input() diamond: boolean = true;
  @Input() borderTop: boolean = true;
  @Input() borderBottom: boolean = true;

  constructor() { }

  ngOnInit(): void {
  }

}
