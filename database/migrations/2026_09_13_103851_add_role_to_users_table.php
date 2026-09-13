<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('user')->after('is_admin');
        });

        // is_admin is a string column with a buggy default ('false'), which
        // PHP's (bool) cast reads as true. Backfill from the raw value so we
        // don't drag that bug into the new role column.
        DB::table('users')->where('is_admin', '1')->update(['role' => 'admin']);
        DB::table('users')->where('is_admin', '!=', '1')->update(['role' => 'user']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
