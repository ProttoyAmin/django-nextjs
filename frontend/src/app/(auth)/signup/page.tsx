'use client'
import SignUpForm from '../components/SignUpForm';
import Link from "next/link";

function SignUpPage() {



  return (
    <>
      <div className="flex flex-col justify-center gap-5.5 border h-screen">
        <div className="flex flex-col gap-5.5 mx-auto w-2/4">
          <h1 className="text-md font-bold text-center">Sign up</h1>

          <div className="mt-4">
            <SignUpForm />
          </div>

          <Link className="text-center" href={'/login'}>
            <button className="cursor-pointer">Already have an account?</button>
          </Link>
        </div>
      </div>
    </>
  );
}

export default SignUpPage;
