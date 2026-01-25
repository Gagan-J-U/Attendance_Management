import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';



class RoleRouter extends StatelessWidget {
  const RoleRouter({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is! AuthStateLoggedIn) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final role = state.user.role;

        switch (role) {
          case "student":
            return BlocProvider(
              create: (_) => StudentBloc(),
              child: const StudentHomeView(),
            );

          case "teacher":
            return BlocProvider(
              create: (_) => TeacherBloc(),
              child: const TeacherHomeView(),
            );

          default:
            return const Scaffold(
              body: Center(child: Text("Unknown role")),
            );
        }
      },
    );
  }
}
