import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShelfLookup } from './shelf-lookup/shelf-lookup';

@Component({
  imports: [RouterOutlet, ShelfLookup],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
