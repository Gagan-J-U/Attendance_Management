import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiClient {
  final String baseUrl;

  ApiClient({required this.baseUrl});

  // Optional: set token later
  String? _token;

  void setToken(String token) {
    _token = token;
  }

  Map<String, String> _headers() {
    final headers = {
      "Content-Type": "application/json",
    };

    if (_token != null) {
      headers["Authorization"] = "Bearer $_token";
    }

    return headers;
  }

  // GET
  Future<dynamic> get(String path) async {
    final url = Uri.parse('$baseUrl$path');

    final response = await http.get(url, headers: _headers());

    return _handleResponse(response);
  }

  // POST
  Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final url = Uri.parse('$baseUrl$path');

    final response = await http.post(
      url,
      headers: _headers(),
      body: jsonEncode(body),
    );

    return _handleResponse(response);
  }

  // PUT
  Future<dynamic> put(String path, Map<String, dynamic> body) async {
    final url = Uri.parse('$baseUrl$path');

    final response = await http.put(
      url,
      headers: _headers(),
      body: jsonEncode(body),
    );

    return _handleResponse(response);
  }

  // DELETE
  Future<dynamic> delete(String path) async {
    final url = Uri.parse('$baseUrl$path');

    final response = await http.delete(url, headers: _headers());

    return _handleResponse(response);
  }

// PATCH
Future<dynamic> patch(String path, Map<String, dynamic> body) async {
  final url = Uri.parse('$baseUrl$path');

  final response = await http.patch(
    url,
    headers: _headers(),
    body: jsonEncode(body),
  );

  return _handleResponse(response);
}

  // Common response handler
  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      return jsonDecode(response.body);
    } else {
      throw Exception(
        "API Error ${response.statusCode}: ${response.body}",
      );
    }
  }
}
