import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:college_management/auth/bloc/auth_event.dart';
import 'package:college_management/auth/bloc/auth_state.dart';
import 'package:college_management/auth/api_auth_provider.dart';
import 'package:college_management/auth/auth_user.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final ApiAuthProvider _authProvider = ApiAuthProvider();

  AuthBloc() : super(const AuthStateUninitialized()) {

    // 🔹 INIT
    on<AuthEventInitialize>((event, emit) async {
      emit(AuthStateLoading());
      try {
        await _authProvider.initialize();
        final user = await _authProvider.currentUser;

        if (user != null) {
          emit(AuthStateLoggedIn(user));
        } else {
          emit(AuthStateLoggedOut());
        }
      } catch (e) {
        emit(AuthStateError(e.toString()));
      }
    });

    // 🔹 LOGIN
    on<AuthEventLogin>((event, emit) async {
      emit(AuthStateLoading());
      try {
        final user = await _authProvider.signInWithEmailAndPassword(
          email: event.email,
          password: event.password,
        );

        emit(AuthStateLoggedIn(user));
      } catch (e) {
        emit(AuthStateError(e.toString()));
      }
    });

    // 🔹 REGISTER
    on<AuthEventRegister>((event, emit) async {
      emit(AuthStateLoading());
      try {
        await _authProvider.signUpWithEmailAndPassword(
          name: event.name,
          email: event.email,
          password: event.password,
          phoneNumber: event.phoneNumber,
          role: event.role,
          studentInfo: event.studentInfo,
          teacherInfo: event.teacherInfo,
        );
        emit(AuthStateLoggedOut());
      } catch (e) {
        emit(AuthStateError(e.toString()));
      }
    });

    // 🔹 FORGOT PASSWORD
    on<AuthEventForgotPassword>((event,emit)async{
      emit(AuthStateLoading());
      try {
        await ApiAuthProvider().sendPasswordResetEmail(email: event.email);
        emit(AuthStateVerifyOTP(event.email));
      } catch (e) {
        emit(AuthStateError(e.toString()));
      }
    });
    on<AuthEventVerifyOTP>((event,emit)async{
      emit(AuthStateLoading());
      try {
        await ApiAuthProvider().verifyOTP(email: event.email, otp: event.otp);
        emit(AuthStateOtpVerified(event.email, event.otp));
      } catch (e) {
        emit(AuthStateError(e.toString()));
      }
    });
    on<AuthEventResetPassword>((event,emit)async{
      emit(AuthStateLoading());
      try {
        await ApiAuthProvider().resetPassword(
          email: event.email,
          otp: event.otp,
          newPassword: event.newPassword,
        );
        emit(const AuthStateResetPasswordSuccess());
        emit(const AuthStateLoggedOut());
      } catch (e) {
        emit(AuthStateError(e.toString()));
      }
    });

    // 🔹 LOGOUT
    on<AuthEventLogOut>((event, emit) async {
      emit(AuthStateLoading());
      try {
        await _authProvider.logOut();
        emit(AuthStateLoggedOut());
      } catch (e) {
        emit(AuthStateError(e.toString()));
      }
    });

    on<AuthEventShouldRegister>((event, emit) {
      emit(const AuthStateRegister());
    });

    on<AuthEventShouldForgotPassword>((event, emit) {
      emit(const AuthStateForgotPassword());
    });
  }
}
