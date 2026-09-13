import { usePage } from "@inertiajs/react";
import ReactMarkdown from "react-markdown";
import React from "react";
import { TrashIcon } from "@heroicons/react/24/solid";
import UserAvatar from "./UserAvatar";
import MessageAttachments from "./MessageAttachments";
import { formatMessageDateLong } from "@/helpers";
import { useToast } from "@/ToastContext";

const MessageItem = ({ message, attachmentClick }) => {
    const currentUser = usePage().props.auth.user;
    const toast = useToast();
    const isOwnMessage = message.sender_id === currentUser.id;

    const onDeleteClick = () => {
        if (!confirm("Are you sure you want to delete this message?")) {
            return;
        }

        axios
            .delete(route("message.destroy", message.id))
            .then(() => {
                toast.success("Message deleted");
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message || "Failed to delete message");
            });
    };

    return (

        //DAISY UI BLESS *chat bubble
        <div
            className={
                "chat " +
                (isOwnMessage
                    ? "chat-end"
                    : "chat-start")
            }
        >
            <UserAvatar user={message.sender} />

            <div className="chat-header">
                {message.sender_id !== currentUser.id
                    ? message.sender.name
                    : ""}
                <time className="text-xs opacity-50 ml-2">
                    {formatMessageDateLong(message.created_at)}
                </time>
            </div>
            <div
                className={
                    "chat-bubble relative group " +
                    (isOwnMessage
                        ? "chat-bubble-info"
                        : "")
                }
            >
                {isOwnMessage && (
                    <button
                        onClick={onDeleteClick}
                        title="Delete message"
                        className="hidden group-hover:flex absolute -left-8 top-0 w-6 h-6 items-center justify-center rounded-full bg-gray-800 text-gray-300 hover:text-red-400 hover:bg-gray-700"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}

                <div className="chat-message">
                    <div className="chat-message-content">
                        <ReactMarkdown>{message.message}</ReactMarkdown>
                    </div>
                    <MessageAttachments
                        attachments={message.attachments}
                        attachmentClick={attachmentClick}
                    />
                </div>
            </div>


        </div>
    );
};

export default MessageItem;