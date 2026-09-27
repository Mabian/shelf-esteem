import { Component } from '@angular/core';

import { Legal } from '../legal/legal';

@Component({
  selector: 'app-footer',
  imports: [Legal],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {}
