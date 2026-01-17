"use client";
import LoginForm from "../components/LoginForm";
import { useAppSelector } from "@/src/redux-store/hooks";
import Link from "next/link";

function LoginPage() {
  const isAuthenticated = useAppSelector(
    (state) => state.auth.isAuthenticated
  );


  return (
    <>
      <div className="flex flex-col justify-center gap-5.5 border h-screen">
        <div className="flex flex-col gap-5.5 mx-auto w-2/4">
          <h1 className="text-md font-bold text-center">Login</h1>

          <div className="mt-4">
            <LoginForm />
          </div>

          <Link className="text-center" href={'/signup'}>
            <button className="cursor-pointer">Create new account</button>
          </Link>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
