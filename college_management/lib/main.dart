import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:college_management/auth/bloc/auth_bloc.dart';
import 'package:college_management/views/role_router.dart';
import 'package:college_management/views/splash_screen.dart';
import 'package:college_management/auth/api_auth_provider.dart';


void main() {
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);
  runApp(
    BlocProvider(
      create: (context) => AuthBloc(ApiAuthProvider().initialize()),
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        home: SplashScreen(),
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
  @override
  void initState() {
    super.initState();

    // 🔥 trigger auth initialization once
    context.read<AuthBloc>().add(AuthEventInitialize());
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthStateLoading) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (_) => const Center(child: CircularProgressIndicator()),
          );
        else if(state is AuthStateError){
          Navigator.of(context, rootNavigator: true).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.error)),
          );
        }
        } else {
          Navigator.of(context, rootNavigator: true).pop();
        }
      },
      builder: (context, state) {
        if (state is AuthStateLoggedOut) {
          return const LoginView();
        } else if (state is AuthStateRegister) {
          return const RegisterView();
        } else if (state is AuthStateLoggedIn) {
          return const RoleRouter();
        } else if (state is AuthStateForgotPassword) {
          return const ForgotPasswordView();
        } else {
          return const SplashScreen();
        }
      },
    );
  }
}
