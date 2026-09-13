import { useState } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import {
    ArrowLeftIcon,
    InformationCircleIcon,
    UserGroupIcon,
    PencilSquareIcon,
    TrashIcon,
    ShieldCheckIcon,
    ShieldExclamationIcon,
    XCircleIcon,
} from "@heroicons/react/24/solid";
import UserAvatar from "./UserAvatar";
import GroupAvatar from "./GroupAvatar";
import GroupModal from "./GroupModal";
import Modal from "@/Components/Modal";
import { useToast } from "@/ToastContext";

const ConversationHeader = ({ selectedConversation }) => {
    const currentUser = usePage().props.auth.user;
    const toast = useToast();
    const [showInfo, setShowInfo] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    const isOwner =
        selectedConversation?.is_group &&
        selectedConversation.owner_id === currentUser.id;

    const isGroupAdmin =
        selectedConversation?.is_group &&
        !!selectedConversation.users.find((u) => u.id === currentUser.id)
            ?.group_is_admin;

    const canManageMembers = isOwner || isGroupAdmin;

    const onToggleGroupAdmin = (member) => {
        axios
            .put(route("group.members.update", [selectedConversation.id, member.id]), {
                is_admin: !member.group_is_admin,
            })
            .then(() => {
                toast.success(
                    member.group_is_admin
                        ? `${member.name} is no longer a group admin`
                        : `${member.name} is now a group admin`
                );
                router.reload({ preserveScroll: true });
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message || "Failed to update member");
            });
    };

    const onRemoveMember = (member) => {
        if (!confirm(`Remove ${member.name} from the group?`)) {
            return;
        }

        axios
            .delete(route("group.members.destroy", [selectedConversation.id, member.id]))
            .then(() => {
                toast.success(`${member.name} was removed from the group`);
                router.reload({ preserveScroll: true });
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message || "Failed to remove member");
            });
    };

    const onDeleteGroupClick = () => {
        if (!confirm("Are you sure you want to delete this group?")) {
            return;
        }

        axios
            .delete(route("group.destroy", selectedConversation.id))
            .then(() => {
                toast.success("Group deleted");
                router.visit(route("dashboard"));
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message || "Failed to delete group");
            });
    };

    return (
        <>
            {selectedConversation && (
                <div className="p-3 flex flex-col border-b border-slate-700">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Link
                                href={route("dashboard")}
                                className="inline-block sm:hidden"
                            >
                                <ArrowLeftIcon className="w-6" />
                            </Link>

                            {selectedConversation.is_user && (
                                <UserAvatar user={selectedConversation} />
                            )}
                            {selectedConversation.is_group && <GroupAvatar />}
                            <div>
                                <h3>{selectedConversation.name}</h3>

                                {selectedConversation.is_group && (
                                    <p className="text-xs text-gray-500">
                                        {selectedConversation.users.length} members
                                    </p>
                                )}
                            </div>
                        </div>

                        {selectedConversation.is_group && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setShowInfo((prev) => !prev)}
                                    title="Group info"
                                    className="p-1 text-gray-400 hover:text-gray-200"
                                >
                                    <InformationCircleIcon className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => setShowMembers(true)}
                                    title="Members"
                                    className="p-1 text-gray-400 hover:text-gray-200"
                                >
                                    <UserGroupIcon className="w-5 h-5" />
                                </button>

                                {isOwner && (
                                    <button
                                        onClick={() => setShowEdit(true)}
                                        title="Edit group"
                                        className="p-1 text-gray-400 hover:text-gray-200"
                                    >
                                        <PencilSquareIcon className="w-5 h-5" />
                                    </button>
                                )}

                                {isOwner && (
                                    <button
                                        onClick={onDeleteGroupClick}
                                        title="Delete group"
                                        className="p-1 text-gray-400 hover:text-red-400"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {showInfo && selectedConversation.is_group && (
                        <p className="mt-2 text-sm text-gray-400">
                            {selectedConversation.description ||
                                "No description provided."}
                        </p>
                    )}
                </div>
            )}

            {selectedConversation?.is_group && (
                <Modal show={showMembers} onClose={() => setShowMembers(false)}>
                    <div className="p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Members
                        </h2>

                        <div className="mt-4 max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                            {selectedConversation.users.map((user) => {
                                const isMemberOwner =
                                    user.id === selectedConversation.owner_id;

                                return (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-2 py-2"
                                    >
                                        <UserAvatar user={user} />
                                        <span className="text-sm text-gray-800 dark:text-gray-200">
                                            {user.name}
                                        </span>
                                        {isMemberOwner && (
                                            <span className="text-xs text-gray-500">
                                                (owner)
                                            </span>
                                        )}
                                        {!isMemberOwner && user.group_is_admin && (
                                            <span className="text-xs text-gray-500">
                                                (group admin)
                                            </span>
                                        )}

                                        <div className="flex-1" />

                                        {isOwner && !isMemberOwner && (
                                            <button
                                                onClick={() => onToggleGroupAdmin(user)}
                                                title={
                                                    user.group_is_admin
                                                        ? "Remove group admin"
                                                        : "Make group admin"
                                                }
                                                className="p-1 text-gray-400 hover:text-gray-200"
                                            >
                                                {user.group_is_admin ? (
                                                    <ShieldExclamationIcon className="w-4 h-4" />
                                                ) : (
                                                    <ShieldCheckIcon className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}

                                        {canManageMembers &&
                                            !isMemberOwner &&
                                            (isOwner || !user.group_is_admin) && (
                                                <button
                                                    onClick={() => onRemoveMember(user)}
                                                    title="Remove from group"
                                                    className="p-1 text-gray-400 hover:text-red-400"
                                                >
                                                    <XCircleIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Modal>
            )}

            {selectedConversation?.is_group && (
                <GroupModal
                    show={showEdit}
                    onClose={() => setShowEdit(false)}
                    group={selectedConversation}
                />
            )}
        </>
    );
};

export default ConversationHeader;
