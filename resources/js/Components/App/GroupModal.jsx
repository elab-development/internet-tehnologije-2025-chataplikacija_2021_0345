import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import UserAvatar from "./UserAvatar";
import { useToast } from "@/ToastContext";

const GroupModal = ({ show, onClose, group = null }) => {
    const toast = useToast();
    const isEditMode = !!group;

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!show) {
            return;
        }

        setName(group?.name || "");
        setDescription(group?.description || "");
        setSelectedUserIds((group?.user_ids || []).map((id) => Number(id)));

        setLoadingUsers(true);
        axios
            .get(route("user.index"))
            .then(({ data }) => setUsers(data.data))
            .finally(() => setLoadingUsers(false));
    }, [show, group]);

    const toggleUser = (userId) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const onSubmit = (ev) => {
        ev.preventDefault();

        if (submitting) {
            return;
        }

        if (!name.trim()) {
            toast.error("Group name is required.");
            return;
        }

        if (selectedUserIds.length === 0) {
            toast.error("Select at least one member.");
            return;
        }

        const data = {
            name,
            description,
            user_ids: selectedUserIds,
        };

        setSubmitting(true);

        const request = isEditMode
            ? axios.put(route("group.update", group.id), data)
            : axios.post(route("group.store"), data);

        request
            .then(({ data: savedGroup }) => {
                toast.success(isEditMode ? "Group updated" : "Group created");
                setSubmitting(false);
                onClose();

                router.visit(route("chat.group", savedGroup.id), {
                    preserveScroll: true,
                });
            })
            .catch((err) => {
                setSubmitting(false);
                toast.error(err?.response?.data?.message || "Failed to save group");
            });
    };

    return (
        <Modal show={show} onClose={onClose}>
            <form onSubmit={onSubmit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {isEditMode ? "Edit Group" : "Create Group"}
                </h2>

                <div className="mt-4">
                    <InputLabel htmlFor="group_name" value="Name" />
                    <TextInput
                        id="group_name"
                        value={name}
                        onChange={(ev) => setName(ev.target.value)}
                        className="mt-1 block w-full"
                    />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="group_description" value="Description" />
                    <textarea
                        id="group_description"
                        value={description}
                        onChange={(ev) => setDescription(ev.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    />
                </div>

                <div className="mt-4">
                    <InputLabel value="Members" />
                    <div className="mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-300 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                        {loadingUsers && (
                            <div className="p-3 text-sm text-gray-500">
                                Loading users...
                            </div>
                        )}

                        {!loadingUsers &&
                            users.map((user) => (
                                <label
                                    key={user.id}
                                    className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedUserIds.includes(user.id)}
                                        onChange={() => toggleUser(user.id)}
                                    />
                                    <UserAvatar user={user} />
                                    <span className="text-sm text-gray-800 dark:text-gray-200">
                                        {user.name}
                                    </span>
                                </label>
                            ))}
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                    >
                        Cancel
                    </button>

                    <PrimaryButton disabled={submitting}>
                        {isEditMode ? "Save Changes" : "Create Group"}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
};

export default GroupModal;
