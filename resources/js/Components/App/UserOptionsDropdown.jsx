//headless ui drowpdown copy
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { usePage } from "@inertiajs/react";

import {
    CheckIcon,
    EllipsisVerticalIcon,
    LockClosedIcon,
    LockOpenIcon,
} from "@heroicons/react/24/solid";
import { useToast } from "@/ToastContext";

const ROLES = [
    { value: "user", label: "User" },
    { value: "moderator", label: "Moderator" },
    { value: "admin", label: "Admin" },
];

export default function UserOptionsDropdown({ conversation }) {
    const toast = useToast();
    const currentUser = usePage().props.auth.user;
    const canChangeRole = currentUser.role === "admin";

    const changeUserRole = (role) => {
        if (!conversation.is_user || role === conversation.role) {
            return;
        }

        axios
            .post(route("user.changeRole", conversation.id), { role })
            .then((res) => {
                toast.success(res.data?.message || "Role updated successfully");
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message || "Something went wrong");
            });
    };

    const onBlockUser = () => {
        if (!conversation.is_user) {
            return;
        }

        axios
            .post(route("user.blockUnblock", conversation.id))
            .then((res) => {
                toast.success(
                    res.data?.message ||
                        (conversation.blocked_at ? "User unblocked" : "User blocked")
                );
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message || "Something went wrong");
            });
    };

    return (
        <div>
            <Menu as="div" className="relative inline-block text-left">
                <div>
                    <Menu.Button
                        className="flex justify-center items-center w-8 h-8 rounded-full hover:bg-black/40"
                    >
                        <EllipsisVerticalIcon className="h-5 w-5" />
                    </Menu.Button>
                </div>

                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute right-0 mt-2 w-48 rounded-md bg-gray-800 shadow-lg z-50">
                        <div className="px-1 py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <button
                                        onClick={onBlockUser}
                                        className={`${
                                            active
                                                ? "bg-black/30 text-white"
                                                : "text-gray-100"
                                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                    >
                                        {conversation.blocked_at && (
                                            <>
                                                <LockOpenIcon className="w-4 h-4 mr-2" />
                                                Unblock User
                                            </>
                                        )}
                                        {!conversation.blocked_at && (
                                            <>
                                                <LockClosedIcon className="w-4 h-4 mr-2" />
                                                Block User
                                            </>
                                        )}
                                    </button>
                                )}
                            </Menu.Item>
                        </div>

                        {canChangeRole && (
                            <div className="px-1 py-1">
                                <div className="px-2 pt-1 pb-1 text-xs uppercase text-gray-500">
                                    Role
                                </div>
                                {ROLES.map((role) => (
                                    <Menu.Item key={role.value}>
                                        {({ active }) => (
                                            <button
                                                onClick={() => changeUserRole(role.value)}
                                                className={`${
                                                    active
                                                        ? "bg-black/30 text-white"
                                                        : "text-gray-100"
                                                } group flex w-full items-center justify-between rounded-md px-2 py-2 text-sm`}
                                            >
                                                {role.label}
                                                {conversation.role === role.value && (
                                                    <CheckIcon className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>
                        )}
                    </Menu.Items>
                </Transition>
            </Menu>
        </div>
    );
}
