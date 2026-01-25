import 'package:flutter/foundation.dart';

@immutable
class AuthUser {
  final String id;
  final String email;
  final String role;
  final String name;

  const AuthUser({
    required this.id,
    required this.email,
    required this.role,
    required this.name,
  });
}

