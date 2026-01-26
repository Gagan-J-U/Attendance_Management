
abstract class AuthEvent {
  const AuthEvent();
}

class AuthEventInitialize extends AuthEvent {
  const AuthEventInitialize();
}

class AuthEventLogin extends AuthEvent {
  final String email;
  final String password;
  const AuthEventLogin(this.email, this.password);
}

class AuthEventRegister extends AuthEvent {
  final String name;
  final String email;
  final String password;
  final String? phoneNumber;
  final String role;
  final Map<String, dynamic>? studentInfo;
  final Map<String, dynamic>? teacherInfo;
  
  const AuthEventRegister({
    required this.name,
    required this.email,
    required this.password,
    this.phoneNumber,
    required this.role,
    this.studentInfo,
    this.teacherInfo,
  });
}

class AuthEventForgotPassword extends AuthEvent {
  final String email;
  const AuthEventForgotPassword(this.email);
}

class AuthEventVerifyOTP extends AuthEvent {
  final String email;
  final String otp;
  const AuthEventVerifyOTP(this.email, this.otp);
}

class AuthEventResetPassword extends AuthEvent {
  final String email;
  final String otp;
  final String newPassword;
  const AuthEventResetPassword({
    required this.email,
    required this.otp,
    required this.newPassword,
  });
}

class AuthEventShouldRegister extends AuthEvent {
  const AuthEventShouldRegister();
}

class AuthEventShouldForgotPassword extends AuthEvent {
  const AuthEventShouldForgotPassword();
}

class AuthEventLogOut extends AuthEvent {
  const AuthEventLogOut();
}
