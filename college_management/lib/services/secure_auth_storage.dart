import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureAuthStorage {
  static const _tokenKey = "auth_token";
  static const _expiryKey = "auth_token_expiry";

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  /// Save token + expiry
  Future<void> saveToken({
    required String token,
    required DateTime expiry,
  }) async {
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _expiryKey, value: expiry.toIso8601String());
  }

  /// Read token (null if missing or expired)
  Future<String?> getValidToken() async {
    final token = await _storage.read(key: _tokenKey);
    final expiryString = await _storage.read(key: _expiryKey);

    if (token == null || expiryString == null) {
      return null;
    }

    final expiry = DateTime.parse(expiryString);

    // if expired → delete and return null
    if (DateTime.now().isAfter(expiry)) {
      await deleteToken();
      return null;
    }

    return token;
  }

  /// Delete token (logout or expiry)
  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _expiryKey);
  }
}
