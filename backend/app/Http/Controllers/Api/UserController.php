<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::orderBy('name')->get(['id', 'name', 'email', 'role', 'locale']));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,staff',
            'locale' => 'nullable|in:th,en',
        ]);

        $user = User::create($data);

        return response()->json($user->only(['id', 'name', 'email', 'role', 'locale']), 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:6',
            'role' => 'required|in:admin,staff',
            'locale' => 'nullable|in:th,en',
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json($user->only(['id', 'name', 'email', 'role', 'locale']));
    }

    public function destroy(User $user)
    {
        abort_if($user->id === auth()->id(), 422, 'ไม่สามารถลบบัญชีตัวเองได้');

        $user->delete();

        return response()->json(['message' => 'deleted']);
    }
}
