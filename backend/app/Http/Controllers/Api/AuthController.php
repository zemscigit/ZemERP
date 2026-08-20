<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['อีเมลหรือรหัสผ่านไม่ถูกต้อง'],
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'locale', 'is_active']),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->only(['id', 'name', 'email', 'phone', 'role', 'locale', 'is_active']));
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'avatar' => 'nullable|string',
            'locale' => 'nullable|in:th,en',
            'current_password' => 'required_with:password',
            'password' => 'nullable|string|min:6',
        ]);

        // ถ้ามี password ต้อง verify current_password ก่อน
        if (! empty($data['password'])) {
            if (! \Illuminate\Support\Facades\Hash::check($data['current_password'], $user->password)) {
                return response()->json(['message' => 'รหัสผ่านปัจจุบันไม่ถูกต้อง'], 422);
            }
            $user->password = $data['password'];
            unset($data['password'], $data['current_password']);
        } else {
            unset($data['password'], $data['current_password']);
        }

        $user->update($data);
        $user = $user->fresh();

        return response()->json($user->only(['id', 'name', 'email', 'phone', 'role', 'locale', 'is_active']));
    }
}
