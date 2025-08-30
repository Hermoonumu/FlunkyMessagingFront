import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginForm } from '../../services/auth-service';
import { Router } from '@angular/router';
import { WebService } from '../../services/web-service';
import { of } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})


export class Login {
  username:string|null=null;
  password:string|null=null;
  creds : LoginForm = {username:null, password:null};
  isSignInFailed:boolean = false;
  passwdOrUsernameShort:boolean = false;
  userExists:boolean = false;
  tryingToSignUp:boolean = false;
  regisrationSuccess:boolean = false;
  regError:boolean = false;
  criticalError:boolean = false;
  toError500:number = 0;


  constructor(private auth:AuthService, private router:Router, private web:WebService,
     private cdRef: ChangeDetectorRef){}

  submitLogin(){
    this.creds.username = this.username;
    this.creds.password = this.password;
    this.auth.login(this.creds).subscribe(resp => {
      console.log(resp)
      if (resp==1) {
        this.router.navigate(['/chats']);
        return;
      } 
      if (resp==-1){
        this.criticalError=true;
        return;
      }
      if(resp==0) {
        this.isSignInFailed = true;
        return;
      }
    });
  }

  submitRegister(){
    this.creds.username = this.username;
    this.creds.password = this.password;
    this.web.newUserCreate(this.creds).subscribe({
  next: (code) => {
    console.log('Success code:', code); // only 2xx
    if (code === 200) {
      console.log("YOU HAVE TO LOG");
      this.signUpSignInSwitch();
      this.regisrationSuccess = true;
      this.cdRef.detectChanges();
    }
  },
  error: (err) => {
    if (err.status === 400) {
      this.passwdOrUsernameShort = true;
      this.userExists = false;
      this.regisrationSuccess=false;
      this.regError = false;
      this.cdRef.detectChanges();
    }
    if (err.status === 409) {
      this.userExists = true;
      this.regisrationSuccess=false;
      this.passwdOrUsernameShort = false;
      this.regError = false;
      this.cdRef.detectChanges();
    }
    if (err.status !== 400 && err.status !== 409) {
      this.passwdOrUsernameShort = false;
      this.regisrationSuccess=false;
      this.userExists = false;
      this.regError = true;
      this.cdRef.detectChanges();
    }
    if (err.status === 500){
      this.criticalError=true;
    }
  }
});

  }

  signUpSignInSwitch(){
    this.tryingToSignUp=!this.tryingToSignUp;
    this.username = "";
    this.password = "";
    this.isSignInFailed = false;
    this.passwdOrUsernameShort = false;
    this.userExists = false;
    this.regError=false;
  }

  signInSignUpSelector(select:boolean){
    if (!select){
      this.submitLogin();
    } else {
      if (this.password!.length<8||this.username!.length<6){
        this.passwdOrUsernameShort = true;
      }
      this.submitRegister();
    }
  }

  errorEasterEggIncrement(){
    this.toError500+=1;
    if (this.username=="IWantError!!!" && this.password=="IWantError!!!"&& this.toError500>=10){
      this.criticalError=true;
    }
  }
}
