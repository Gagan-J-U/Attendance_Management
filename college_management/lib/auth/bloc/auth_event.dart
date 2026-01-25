
abstract class AuthEvent {
  const AuthEvent();
}

class AuthEventInitialize extends AuthEvent {
  const AuthEventInitialize();
}

class AuthEventLogin extends AuthEvent {
  const AuthEventLogin();
}

class AuthEventRegister extends AuthEvent {
  const AuthEventRegister();
}

class AuthEventForgotPassword extends AuthEvent {
  const AuthEventForgotPassword();
}

class AuthEventVerifyOTP extends AuthEvent {
  const AuthEventVerifyOTP();
}
