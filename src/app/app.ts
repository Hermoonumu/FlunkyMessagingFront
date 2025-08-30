import { Component } from '@angular/core';
import { Router, RouterOutlet, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './services/auth-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'MessagingFront';

  constructor(private authService:AuthService,
    private router:Router
  ){
  }
}
