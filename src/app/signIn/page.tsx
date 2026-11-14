"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { FaGoogle } from "react-icons/fa";

export default function LoginPage() {
  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl text-gray-800 font-bold mb-6 text-center">Sign In</h1>
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-black transition flex items-center justify-center gap-2"
        >
          <FaGoogle />
          Continue with Google
        </button>
        <Link href="/register" className="block mt-6 text-center underline">Crear una cuenta</Link>
      </div>
    </div>
  );
}
