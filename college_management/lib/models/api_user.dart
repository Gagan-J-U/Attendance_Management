class ApiUser {
  final String id;
  final String email;
  final String role;
  final String name;

  ApiUser({
    required this.id,
    required this.email,
    required this.role,
    required this.name,
  });

  factory ApiUser.fromJson(Map<String, dynamic> json) {
    return ApiUser(
      id: json['id'].toString(),   // or json['_id']
      email: json['email'],
      role: json['role'],
      name: json['name'] ?? '',
    );
  }
}
