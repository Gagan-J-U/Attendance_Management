import 'auth_user.dart';

abstract class AuthProvider {
  Future<void> initialize();
  AuthUser? get currentUser;
  Future<void> logOut();
  Future<void> signInWithEmailAndPassword({required String email, required String password});
  Future<void> signUpWithEmailAndPassword({
    required String name,
    required String email,
    required String password,
    String? phoneNumber,
    required String role,
    Map<String, dynamic>? studentInfo,
    Map<String, dynamic>? teacherInfo,
    Map<String, dynamic>? adminInfo,
  });
  Future<void> sendPasswordResetEmail({required String email});
  Future<void> verifyOTP({required String email, required String otp});
  Future<void> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  });
}
