import 'auth_user.dart';
import '../models/api_user.dart';

class AuthUserMapper {
  static AuthUser fromApiUser(ApiUser user) {
    return AuthUser(
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    );
  }
}
