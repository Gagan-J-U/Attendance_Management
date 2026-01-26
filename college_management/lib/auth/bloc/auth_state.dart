import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';
import 'package:college_management/auth/auth_user.dart';

abstract class AuthState {
  const AuthState();
}

class AuthStateUninitialized extends AuthState {
  const AuthStateUninitialized();
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
  final String email;
  const AuthStateVerifyOTP(this.email);
}

class AuthStateOtpVerified extends AuthState {
  final String email;
  final String otp;
  const AuthStateOtpVerified(this.email, this.otp);
}

class AuthStateResetPasswordSuccess extends AuthState {
  const AuthStateResetPasswordSuccess();
}

class AuthStateLoading extends AuthState {
  const AuthStateLoading();
}

class AuthStateError extends AuthState {
  final String error;

  AuthStateError(this.error);
}
