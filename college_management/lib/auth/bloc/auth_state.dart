import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';
import 'package:my_app/services/auth/auth_user.dart';

abstract class AuthState {
  const AuthState();
}

class AuthStateLoggedOut extends AuthState {
  const AuthStateLoggedOut();
}

class AuthStateLoggedIn extends AuthState {
  final AuthUser user;

  AuthStateLoggedIn(this.user);
}

class AuthStateRegister extends AuthState {
  const AuthStateRegister();
}

class AuthStateForgotPassword extends AuthState {
  const AuthStateForgotPassword();
}

class AuthStateVerifyOTP extends AuthState {
  const AuthStateVerifyOTP();
}

class AuthStateLoading extends AuthState {
  const AuthStateLoading();
}

class AuthStateError extends AuthState {
  final String error;

  AuthStateError(this.error);
}
