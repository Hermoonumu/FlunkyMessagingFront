import { Injectable, resolveForwardRef } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResourceFn, HttpResponse } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

export const apiURL:string = "https://flunkymessagingapp.onrender.com/api/auth";


export interface TokenPair{
  accessToken:string;
  refreshToken:string;
}

export interface RefreshTokenDTO{
  refreshToken:string
}

export interface LoginForm {
  username:string|null;
  password:string|null;
}

export interface TokenPayload{
  unique_name:string;
}



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isAuthenticated : boolean = false;
  username : string = "";
  private parsed:TokenPair|null = null;
  accessToken:string = "";
  refreshToken:string="";
  constructor(private http:HttpClient){}
  result:Object|null=null;

  login(creds: LoginForm): Observable<number> {
  return this.http.post<TokenPair>(`${apiURL}/login`, creds, { observe: 'response' }).pipe(
    map((res: HttpResponse<TokenPair>) => {
      this.isAuthenticated = true;
      this.accessToken = res.body!.accessToken;
      this.username = jwtDecode<TokenPayload>(this.accessToken).unique_name;
      localStorage.setItem("auth", JSON.stringify(res.body));
      
      return 1; 
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 500) {
        return of(-1);
      }
      if (error.status === 401) {
        this.isAuthenticated = false;
        return of(0);
      }
      return of(0);
    })
  );
}


  verifyTokens(): Observable<boolean> {
  const authData = localStorage.getItem('auth');
  if (!authData) {
    this.isAuthenticated = false;
    return of(false);
  }
  this.parsed = JSON.parse(authData);
  const headers = new HttpHeaders({
    Authorization: `Bearer ${this.parsed!.accessToken}`
  });

  return this.http.get(apiURL, { headers, observe:'response' }).pipe(
    map((res: HttpResponse<Object>) => {
      if (res.status === 200) {
        this.accessToken = this.parsed!.accessToken;
        this.username = jwtDecode<TokenPayload>(this.accessToken).unique_name;
        this.isAuthenticated = true;
        return true;
      }
      return false;
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        console.log("Token expired or unauthorized, attempting refresh...");
        this.refreshToken = this.parsed!.refreshToken;
        return this.http.post<TokenPair>(`${apiURL}/refresh`, { refreshToken: this.refreshToken }).pipe(
          map(tokens => {
            this.isAuthenticated = true;
            this.accessToken = tokens.accessToken;
            this.username = jwtDecode<TokenPayload>(this.accessToken).unique_name;
            localStorage.setItem('auth', JSON.stringify(tokens));
            return true;
          }),
          catchError(() => {
            this.isAuthenticated = false;
            return of(false);
          })
        );
      }
      // For other errors, just return false
      this.isAuthenticated = false;
      return of(false);
    })
  );
}

  logout(){
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`
    });
    return this.http.get(apiURL+'/logout', {headers}).pipe();
  }

}
