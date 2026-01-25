import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../auth/auth_provider.dart';

class RegisterView extends StatefulWidget {
  const RegisterView({super.key});

  @override
  State<RegisterView> createState() => _RegisterViewState();
}

class _RegisterViewState extends State<RegisterView> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();

  // Student fields
  final _rollNoController = TextEditingController();
  final _departmentController = TextEditingController();
  final _semesterController = TextEditingController();
  final _sectionController = TextEditingController();

  // Teacher fields
  final _employeeIdController = TextEditingController();

  String _role = "student"; // default

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    _rollNoController.dispose();
    _departmentController.dispose();
    _semesterController.dispose();
    _sectionController.dispose();
    _employeeIdController.dispose();
    super.dispose();
  }

  void _register() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = context.read<AuthProvider>();

    Map<String, dynamic>? studentInfo;
    Map<String, dynamic>? teacherInfo;

    if (_role == "student") {
      studentInfo = {
        "rollNo": _rollNoController.text,
        "department": _departmentController.text,
        "semester": int.parse(_semesterController.text),
        "section": _sectionController.text,
      };
    } else if (_role == "teacher") {
      teacherInfo = {
        "employeeId": _employeeIdController.text,
        "department": _departmentController.text,
      };
    }

    try {
      await authProvider.signUpWithEmailAndPassword(
        name: _nameController.text,
        email: _emailController.text,
        password: _passwordController.text,
        phoneNumber: _phoneController.text,
        role: _role,
        studentInfo: studentInfo,
        teacherInfo: teacherInfo,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Registration successful. Please login.")),
      );

      Navigator.pop(context); // go back to login
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Register")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Common fields
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: "Name"),
                validator: (v) {
                  if (v == null || v.isEmpty) return "Enter name";
                  return null;
                },
              ),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: "Email"),
                validator: (v) {
                  if (v == null || !v.contains("@")) return "Enter valid email";
                  return null;
                },
              ),
              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: "Password"),
                obscureText: true,
                validator: (v) {
                  if (v == null || v.length < 6) {
                    return "Password must be at least 6 characters";
                  }
                  return null;
                },
              ),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(labelText: "Phone"),
              ),

              const SizedBox(height: 16),

              // Role selector
              DropdownButtonFormField<String>(
                value: _role,
                decoration: const InputDecoration(labelText: "Role"),
                items: const [
                  DropdownMenuItem(value: "student", child: Text("Student")),
                  DropdownMenuItem(value: "teacher", child: Text("Teacher")),
                ],
                onChanged: (v) {
                  setState(() {
                    _role = v!;
                  });
                },
              ),

              const SizedBox(height: 16),

              // Student fields
              if (_role == "student") ...[
                TextFormField(
                  controller: _rollNoController,
                  decoration: const InputDecoration(labelText: "Roll No"),
                  validator: (v) {
                    if (v == null || v.isEmpty) return "Enter roll number";
                    return null;
                  },
                ),
                TextFormField(
                  controller: _departmentController,
                  decoration: const InputDecoration(labelText: "Department"),
                ),
                TextFormField(
                  controller: _semesterController,
                  decoration: const InputDecoration(labelText: "Semester"),
                  keyboardType: TextInputType.number,
                  validator: (v) {
                    if (v == null || v.isEmpty) return "Enter semester";
                    return null;
                  },
                ),
                TextFormField(
                  controller: _sectionController,
                  decoration: const InputDecoration(labelText: "Section"),
                ),
              ],

              // Teacher fields
              if (_role == "teacher") ...[
                TextFormField(
                  controller: _employeeIdController,
                  decoration: const InputDecoration(labelText: "Employee ID"),
                  validator: (v) {
                    if (v == null || v.isEmpty) return "Enter employee ID";
                    return null;
                  },
                ),
                TextFormField(
                  controller: _departmentController,
                  decoration: const InputDecoration(labelText: "Department"),
                ),
              ],

              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _register,
                child: const Text("Register"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
