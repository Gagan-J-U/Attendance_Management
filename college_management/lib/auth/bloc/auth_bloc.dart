import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:college_management/auth/bloc/auth_event.dart';
import 'package:college_management/auth/bloc/auth_state.dart';
import 'package:college_management/auth/api_auth_provider.dart';


class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc() : super(AuthStateLoggedOut()) {
    on<AuthEventInitialize>((event,emit) async{
      emit(AuthStateLoading());
      try {
        await ApiAuthProvider().initialize();
        const user=ApiAuthProvider().currentUser;
        if(user!=null){
          emit(AuthStateLoggedIn(user));
        }
        else emit(AuthStateLoggedOut());
        
      } catch (e) {
        emit(AuthStateError(e.toString()));
      }
    });
    on<AuthEventLogin>((event,emit)async{
      emit(AuthStateLoading());
      try {
        const user=await ApiAuthProvider().signInWithEmailAndPassword(email: event.email, password: event.password);
        if(user!=null){
          emit(AuthStateLoggedIn(user));
        }
        else emit(AuthStateLoggedOut());
      } catch (e) {
        emit(AuthStateError(e.toString()));
      }
    });
    on<AuthEventRegister>((event,emit)async{
      emit(AuthStateLoading());
      try {
        await ApiAuthProvider().signUpWithEmailAndPassword(email: event.email, password: event.password);
        emit(AuthStateLoggedOut());
      } catch (e) {
        emit(AuthStateError(e.toString()));
      }
    });
    on<AuthEventForgotPassword>((event,emit)async{
      emit(AuthStateLoading());
      try {
        await ApiAuthProvider().sendPasswordResetEmail(email: event.email);
        emit(AuthStateVerifyOTP());
      } catch (e) {
        emit(AuthStateError(e.toString()));
      }
    });
    on<AuthEventVerifyOTP>((event,emit)async{
      emit(AuthStateLoading());
      try {
        await ApiAuthProvider().verifyOTP(email: event.email, otp: event.otp);
        emit(AuthStateLoggedOut());
      } catch (e) {
        emit(AuthStateError(e.toString()));
      }
    });
    on<AuthEventLogOut>((event,emit)async{
      emit(AuthStateLoading());
      try {
        await ApiAuthProvider().logOut();
        emit(AuthStateLoggedOut());
      } catch (e) {
        emit(AuthStateError(e.toString()));
      }
    }) ;
  }
}