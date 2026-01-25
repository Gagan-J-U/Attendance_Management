import "auth_provider.dart";
import "auth_user.dart";
import "../services/api_client.dart";
import "../services/secure_auth_storage.dart";
import "auth_user_mapper.dart";
import "../models/api_user.dart";

class ApiAuthProvider implements AuthProvider {
  final ApiClient apiClient;
  final SecureAuthStorage secureStorage;

  AuthUser? _currentUser;
  String? _token;

  ApiAuthProvider(this.apiClient, this.secureStorage);

  @override
  AuthUser? get currentUser => _currentUser;

  // Called when app starts
  @override
  Future<void> initialize() async {
    final storedToken = await secureStorage.getValidToken();

    if (storedToken != null) {
      _token = storedToken;
      apiClient.setToken(storedToken);

      // optionally call /me to fetch user
      final data = await apiClient.get("/auth/me");
      final apiUser = ApiUser.fromJson(data);
      _currentUser = AuthUserMapper.fromApiUser(apiUser);
    }
  }

  @override
  Future<void> signInWithEmailAndPassword({
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
    final expiresIn = data["expiresIn"]; // e.g. 3600
    final expiry = DateTime.now().add(Duration(seconds: expiresIn));

    final authUser = AuthUserMapper.fromApiUser(apiUser);

    _currentUser = authUser;
    _token = token;

    apiClient.setToken(token);

    // 🔐 SAVE TOKEN SECURELY
    await secureStorage.saveToken(
      token: token,
      expiry: expiry,
    );
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
