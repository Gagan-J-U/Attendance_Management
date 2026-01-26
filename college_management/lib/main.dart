import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:college_management/auth/bloc/auth_bloc.dart';
import 'package:college_management/auth/bloc/auth_state.dart';
import 'package:college_management/auth/bloc/auth_event.dart';
import 'package:college_management/views/role_router.dart';
import 'package:college_management/views/auth_page/auth_login_view.dart';
import 'package:college_management/views/auth_page/auth_register_view.dart';
import 'package:college_management/views/auth_page/auth_forgot_password_view.dart';
import 'package:college_management/views/splash_screen.dart';



void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);
  runApp(
    BlocProvider(
      create: (context) => AuthBloc(),
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        home: AuthPage(),
      ),
    ),
  );
}

class AuthPage extends StatefulWidget {
  const AuthPage({super.key});

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  bool _isDialogShown = false;

  @override
  void initState() {
    super.initState();

    // 🔥 trigger auth initialization once
    context.read<AuthBloc>().add(AuthEventInitialize());
  }

  void _dismissDialog() {
    if (_isDialogShown && mounted) {
      Navigator.of(context, rootNavigator: true).pop();
      _isDialogShown = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthStateLoading) {
          if (!_isDialogShown) {
            _isDialogShown = true;
            showDialog(
              context: context,
              barrierDismissible: false,
              builder: (_) => const Center(child: CircularProgressIndicator()),
            );
          }
        } else if(state is AuthStateError){
          _dismissDialog();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.error)),
          );
        } else {
          // Dismiss dialog for any other state (success states)
          _dismissDialog();
        }
      },
      builder: (context, state) {
        if (state is AuthStateLoggedOut) {
          return const LoginView();
        } else if (state is AuthStateRegister) {
          return const RegisterView();
        } else if (state is AuthStateLoggedIn) {
          return const RoleRouter();
        } else if (state is AuthStateForgotPassword || 
                   state is AuthStateVerifyOTP || 
                   state is AuthStateOtpVerified) {
          return const ForgotPasswordView();
        } else if (state is AuthStateUninitialized || state is AuthStateLoading) {
          return const SplashScreen();
        } else {
          return const SplashScreen();
        }
      },
    );
  }
}
