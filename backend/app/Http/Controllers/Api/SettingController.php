<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function show()
    {
        return response()->json([
            'company' => Setting::get('company', [
                'name' => 'ZemERP Co., Ltd.',
                'address' => '',
                'tax_id' => '',
                'phone' => '',
                'email' => '',
                'logo' => '',
            ]),
            'vat_rate' => Setting::get('vat_rate', 7),
            'gl_accounts' => Setting::get('gl_accounts', []),
            'document_footer' => Setting::get('document_footer', ''),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'company' => 'required|array',
            'company.name' => 'required|string|max:255',
            'company.address' => 'nullable|string',
            'company.tax_id' => 'nullable|string|max:20',
            'company.phone' => 'nullable|string|max:50',
            'company.email' => 'nullable|email',
            'vat_rate' => 'nullable|numeric|min:0|max:100',
            'gl_accounts' => 'nullable|array',
            'document_footer' => 'nullable|string',
        ]);

        Setting::set('company', $data['company']);
        Setting::set('vat_rate', $data['vat_rate'] ?? 7);
        Setting::set('gl_accounts', $data['gl_accounts'] ?? []);
        Setting::set('document_footer', $data['document_footer'] ?? '');

        return response()->json([
            'company' => Setting::get('company'),
            'vat_rate' => Setting::get('vat_rate', 7),
            'gl_accounts' => Setting::get('gl_accounts', []),
            'document_footer' => Setting::get('document_footer', ''),
        ]);
    }
}
