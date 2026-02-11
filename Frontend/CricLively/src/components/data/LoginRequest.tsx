export class LoginRequest{
    email !: string;
    password !: string;
    role! : string;

    constructor(init?: Partial<LoginRequest>) {
    Object.assign(this, init);
  }
}