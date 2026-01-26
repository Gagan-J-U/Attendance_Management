import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../../auth/bloc/auth_state.dart';

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

  final _rollNoController = TextEditingController();
  final _departmentController = TextEditingController();
  final _semesterController = TextEditingController();
  final _sectionController = TextEditingController();

  final _employeeIdController = TextEditingController();

  String _role = "student";

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

  void _register() {
    if (!_formKey.currentState!.validate()) return;

    Map<String, dynamic>? studentInfo;
    Map<String, dynamic>? teacherInfo;

    if (_role == "student") {
      studentInfo = {
        "rollNo": _rollNoController.text,
        "department": _departmentController.text,
        "semester": int.parse(_semesterController.text),
        "section": _sectionController.text,
      };
    } else {
      teacherInfo = {
        "employeeId": _employeeIdController.text,
        "department": _departmentController.text,
      };
    }

    context.read<AuthBloc>().add(
      AuthEventRegister(
        name: _nameController.text,
        email: _emailController.text,
        password: _passwordController.text,
        phoneNumber:
            _phoneController.text.isEmpty ? null : _phoneController.text,
        role: _role,
        studentInfo: studentInfo,
        teacherInfo: teacherInfo,
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthStateLoggedOut) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Registration successful! Please login")),
          );
          Navigator.pop(context);
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text("Create Account"),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              context.read<AuthBloc>().add(const AuthEventLogOut());
            },
          ),
        ),
        body: BlocBuilder<AuthBloc, AuthState>(
          builder: (context, state) {
            final isLoading = state is AuthStateLoading;

            return Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Card(
                  elevation: 6,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            "Register",
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 20),

                          TextFormField(
                            controller: _nameController,
                            decoration:
                                _inputDecoration("Full Name", Icons.person),
                            validator: (v) =>
                                v == null || v.isEmpty ? "Enter name" : null,
                          ),
                          const SizedBox(height: 12),

                          TextFormField(
                            controller: _emailController,
                            decoration:
                                _inputDecoration("Email", Icons.email),
                            validator: (v) =>
                                v == null || !v.contains("@")
                                    ? "Enter valid email"
                                    : null,
                          ),
                          const SizedBox(height: 12),

                          TextFormField(
                            controller: _passwordController,
                            decoration:
                                _inputDecoration("Password", Icons.lock),
                            obscureText: true,
                            validator: (v) =>
                                v == null || v.length < 6
                                    ? "Min 6 characters"
                                    : null,
                          ),
                          const SizedBox(height: 12),

                          TextFormField(
                            controller: _phoneController,
                            decoration:
                                _inputDecoration("Phone (optional)", Icons.phone),
                            keyboardType: TextInputType.phone,
                          ),

                          const SizedBox(height: 20),

                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              ChoiceChip(
                                label: const Text("Student"),
                                selected: _role == "student",
                                onSelected: (_) {
                                  setState(() => _role = "student");
                                },
                              ),
                              const SizedBox(width: 12),
                              ChoiceChip(
                                label: const Text("Teacher"),
                                selected: _role == "teacher",
                                onSelected: (_) {
                                  setState(() => _role = "teacher");
                                },
                              ),
                            ],
                          ),

                          const SizedBox(height: 20),

                          if (_role == "student") ...[
                            TextFormField(
                              controller: _rollNoController,
                              decoration: _inputDecoration(
                                  "Roll Number", Icons.badge),
                              validator: (v) =>
                                  v == null || v.isEmpty
                                      ? "Enter roll number"
                                      : null,
                            ),
                            const SizedBox(height: 12),

                            TextFormField(
                              controller: _departmentController,
                              decoration: _inputDecoration(
                                  "Department", Icons.apartment),
                            ),
                            const SizedBox(height: 12),

                            TextFormField(
                              controller: _semesterController,
                              decoration: _inputDecoration(
                                  "Semester", Icons.school),
                              keyboardType: TextInputType.number,
                              validator: (v) =>
                                  v == null || v.isEmpty
                                      ? "Enter semester"
                                      : null,
                            ),
                            const SizedBox(height: 12),

                            TextFormField(
                              controller: _sectionController,
                              decoration:
                                  _inputDecoration("Section", Icons.group),
                            ),
                          ],

                          if (_role == "teacher") ...[
                            TextFormField(
                              controller: _employeeIdController,
                              decoration: _inputDecoration(
                                  "Employee ID", Icons.badge_outlined),
                              validator: (v) =>
                                  v == null || v.isEmpty
                                      ? "Enter employee ID"
                                      : null,
                            ),
                            const SizedBox(height: 12),

                            TextFormField(
                              controller: _departmentController,
                              decoration: _inputDecoration(
                                  "Department", Icons.apartment),
                            ),
                          ],

                          const SizedBox(height: 24),

                          SizedBox(
                            height: 48,
                            child: ElevatedButton(
                              onPressed: isLoading ? null : _register,
                              style: ElevatedButton.styleFrom(
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: isLoading
                                  ? const CircularProgressIndicator(
                                      color: Colors.white,
                                    )
                                  : const Text("Create Account"),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
