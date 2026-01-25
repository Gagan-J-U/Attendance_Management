import 'auth_user.dart';

abstract class AuthProvider {
  Future<void> initialize();
  Future<AuthUser?> get currentUser;
  Future<void> logOut();
  Future<void> signInWithEmailAndPassword({required String email, required String password});
  Future<void> signUpWithEmailAndPassword({required String email, required String password});
  Future<void> sendPasswordResetEmail({required String email});
}
