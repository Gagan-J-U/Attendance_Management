import 'package:college_management/config/app_config.dart';
import 'package:college_management/services/api_client.dart';
import 'package:college_management/services/secure_auth_storage.dart';
import 'auth_provider.dart';
import 'auth_user.dart';
import 'auth_user_mapper.dart';
import '../models/api_user.dart';

class ApiAuthProvider implements AuthProvider {
  static final ApiAuthProvider _instance = ApiAuthProvider._internal();
  factory ApiAuthProvider() => _instance;

  late final ApiClient apiClient;
  late final SecureAuthStorage secureStorage;

  ApiAuthProvider._internal() {
    apiClient = ApiClient(baseUrl: AppConfig.baseUrl);
    secureStorage = SecureAuthStorage();
  }

  AuthUser? _currentUser;
  String? _token;

  @override
  AuthUser? get currentUser => _currentUser;

  // Called when app starts
  @override
  Future<void> initialize() async {
    final storedToken = await secureStorage.getValidToken();

    if (storedToken != null) {
      _token = storedToken;
      apiClient.setToken(storedToken);

      try {
        // optionally call /me to fetch user
        final data = await apiClient.get("/auth/me");
        if (data != null) {
          final apiUser = ApiUser.fromJson(data);
          _currentUser = AuthUserMapper.fromApiUser(apiUser);
        }
      } catch (e) {
        // If /me fails, token might be invalid or server error
        // For now, if it fails, maybe log out or keep token but no user?
        // Let's assume strict auth:
         await logOut();
      }
    }
  }

  @override
  Future<AuthUser> signInWithEmailAndPassword({
  required String email,
  required String password,
}) async {
  final data = await apiClient.post(
    "/auth/login",
    {
      "email": email,
      "password": password,
    },
  );

  final apiUser = ApiUser.fromJson(data["user"]);
  final token = data["token"];

  // backend should send expiry (example: seconds)
  final expiresIn = data["expiresIn"] ?? 3600; // Default to 1 hour if missing
  final expiry = DateTime.now().add(
    Duration(
      seconds: expiresIn is int
          ? expiresIn
          : int.parse(expiresIn.toString()),
    ),
  );

  final authUser = AuthUserMapper.fromApiUser(apiUser);

  _currentUser = authUser;
  _token = token;

  apiClient.setToken(token);

  // 🔐 SAVE TOKEN SECURELY
  await secureStorage.saveToken(
    token: token,
    expiry: expiry,
  );

  // ⭐ IMPORTANT CHANGE
  return authUser;
}


  @override
  Future<void> logOut() async {
    _currentUser = null;
    _token = null;
    apiClient.setToken("");

    // 🔥 DELETE TOKEN
    await secureStorage.deleteToken();
  }

  @override
  Future<void> sendPasswordResetEmail({required String email}) async {
    await apiClient.post(
      "/auth/forgot-password",
      {
        "email": email,
      },
    );
  }

  @override
  Future<void> verifyOTP({required String email, required String otp}) async {
    await apiClient.post(
      "/auth/verify-otp",
      {
        "email": email,
        "otp": otp,
      },
    );
  }

  @override
  Future<void> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    await apiClient.post(
      "/auth/reset-password",
      {
        "email": email,
        "otp": otp,
        "newPassword": newPassword,
      },
    );
  }

  @override
  Future<void> signUpWithEmailAndPassword({
    required String name,
    required String email,
    required String password,
    String? phoneNumber,
    required String role,
    Map<String, dynamic>? studentInfo,
    Map<String, dynamic>? teacherInfo,
    Map<String, dynamic>? adminInfo,
  }) async {
    final body = {
      "name": name,
      "email": email,
      "password": password,
      "phoneNumber": phoneNumber,
      "role": role,
      "studentInfo": studentInfo,
      "teacherInfo": teacherInfo,
      "adminInfo": adminInfo,
    };

    await apiClient.post("/auth/register", body);

    // ❌ Do NOT set token
    // ❌ Do NOT set currentUser
    // User must login after signup
  }
}
