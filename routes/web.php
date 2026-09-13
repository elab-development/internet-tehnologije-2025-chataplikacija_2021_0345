<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\UserController;


Route ::middleware(['auth', 'verified'])->group(function () {
    Route::get('/', [HomeController::class, 'home'])->name('dashboard');
    Route::get('user/{user}', [MessageController::class, 'byUser'])->name('chat.user');
    Route::get('group/{group}', [MessageController::class, 'byGroup'])->name('chat.group');

    Route::post('/message', [MessageController::class, 'store'])->name('message.store');
    Route::delete('/message/{message}', [MessageController::class, 'destroy'])->name('message.destroy');
    Route::get('/message/older/{message}', [MessageController::class, 'loadOlder'])->name('message.loadOlder');

    Route::post('/group', [GroupController::class, 'store'])->name('group.store');
    Route::put('/group/{group}', [GroupController::class, 'update'])->name('group.update');
    Route::delete('/group/{group}', [GroupController::class, 'destroy'])->name('group.destroy');
    Route::put('/group/{group}/members/{user}', [GroupController::class, 'updateMember'])->name('group.members.update');
    Route::delete('/group/{group}/members/{user}', [GroupController::class, 'removeMember'])->name('group.members.destroy');

    Route::get('/users', [UserController::class, 'index'])->name('user.index');
    Route::post('/user/{user}/block-unblock', [UserController::class, 'blockUnblock'])->name('user.blockUnblock');
    Route::post('/user/{user}/change-role', [UserController::class, 'changeRole'])->name('user.changeRole');
});


Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
