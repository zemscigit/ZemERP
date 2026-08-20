<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::query()
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%")
                ->orWhere('email', 'like', "%{$s}%")
                ->orWhere('phone', 'like', "%{$s}%"))
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone', 'role', 'locale', 'is_active']);

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,staff',
            'locale' => 'nullable|in:th,en',
            'is_active' => 'nullable|boolean',
        ]);

        $data['is_active'] = $data['is_active'] ?? true;
        $user = User::create($data);

        return response()->json($user->only(['id', 'name', 'email', 'phone', 'role', 'locale', 'is_active']), 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
            'role' => 'required|in:admin,staff',
            'locale' => 'nullable|in:th,en',
            'is_active' => 'nullable|boolean',
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json($user->only(['id', 'name', 'email', 'phone', 'role', 'locale', 'is_active']));
    }

    public function show(User $user)
    {
        return response()->json($user->only(['id', 'name', 'email', 'phone', 'role', 'locale', 'is_active', 'created_at']));
    }

    public function resetPassword(Request $request, User $user)
    {
        $data = $request->validate([
            'password' => 'required|string|min:6',
        ]);

        $user->update(['password' => $data['password']]);

        return response()->json(['message' => 'Password updated']);
    }

    public function destroy(User $user)
    {
        abort_if($user->id === auth()->id(), 422, 'ไม่สามารถลบบัญชีตัวเองได้');

        $user->delete();

        return response()->json(['message' => 'deleted']);
    }
}
