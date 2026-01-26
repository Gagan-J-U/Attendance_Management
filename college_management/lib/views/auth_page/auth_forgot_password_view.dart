import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_event.dart';
import '../../auth/bloc/auth_state.dart';

class ForgotPasswordView extends StatefulWidget {
  const ForgotPasswordView({Key? key}) : super(key: key);

  @override
  State<ForgotPasswordView> createState() => _ForgotPasswordViewState();
}

class _ForgotPasswordViewState extends State<ForgotPasswordView> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
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
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        String title = "Forgot Password";
        Widget content = Container();

        if (state is AuthStateOtpVerified) {
          title = "Reset Password";
          content = _buildResetPasswordForm(context, state.email, state.otp);
        } else if (state is AuthStateVerifyOTP) {
          title = "Verify OTP";
          content = _buildVerifyOtpForm(context, state.email);
        } else {
          title = "Forgot Password";
          content = _buildEmailForm(context);
        }

        return Scaffold(
          appBar: AppBar(
            title: Text(title),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () {
                context.read<AuthBloc>().add(const AuthEventLogOut());
              },
            ),
          ),
          body: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Form(
                    key: _formKey,
                    child: content,
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmailForm(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Icon(Icons.email_outlined, size: 60, color: Colors.blue),
        const SizedBox(height: 16),
        const Text(
          "Enter your email to receive a 6-digit OTP",
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
        const SizedBox(height: 32),
        TextFormField(
          controller: _emailController,
          decoration: _inputDecoration("Email", Icons.email),
          keyboardType: TextInputType.emailAddress,
          validator: (v) => v == null || !v.contains("@") ? "Enter valid email" : null,
        ),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              context.read<AuthBloc>().add(
                AuthEventForgotPassword(_emailController.text.trim().toLowerCase()),
              );
            }
          },
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Text("Send OTP"),
        ),
      ],
    );
  }

  Widget _buildVerifyOtpForm(BuildContext context, String email) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Icon(Icons.lock_clock_outlined, size: 60, color: Colors.orange),
        const SizedBox(height: 16),
        Text(
          "We sent an OTP to\n$email",
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 16, color: Colors.grey),
        ),
        const SizedBox(height: 32),
        TextFormField(
          controller: _otpController,
          decoration: _inputDecoration("Enter 6-digit OTP", Icons.numbers),
          keyboardType: TextInputType.number,
          maxLength: 6,
          validator: (v) => v == null || v.length != 6 ? "Enter 6 digits" : null,
        ),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              context.read<AuthBloc>().add(
                AuthEventVerifyOTP(email, _otpController.text.trim()),
              );
            }
          },
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            backgroundColor: Colors.orange,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Text("Verify OTP"),
        ),
        TextButton(
          onPressed: () {
            context.read<AuthBloc>().add(AuthEventForgotPassword(email));
          },
          child: const Text("Resend OTP"),
        ),
      ],
    );
  }

  Widget _buildResetPasswordForm(BuildContext context, String email, String otp) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Icon(Icons.update, size: 60, color: Colors.green),
        const SizedBox(height: 16),
        const Text(
          "Set your new password",
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
        const SizedBox(height: 32),
        TextFormField(
          controller: _newPasswordController,
          decoration: _inputDecoration("New Password", Icons.lock),
          obscureText: true,
          validator: (v) => v == null || v.length < 6 ? "Min 6 characters" : null,
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _confirmPasswordController,
          decoration: _inputDecoration("Confirm Password", Icons.lock_outline),
          obscureText: true,
          validator: (v) {
            if (v != _newPasswordController.text) return "Passwords do not match";
            return null;
          },
        ),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState!.validate()) {
              context.read<AuthBloc>().add(
                AuthEventResetPassword(
                  email: email,
                  otp: otp,
                  newPassword: _newPasswordController.text,
                ),
              );
            }
          },
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            backgroundColor: Colors.green,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Text("Reset Password"),
        ),
      ],
    );
  }
}
