
import ChatLayout from '@/Layouts/ChatLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {useRef, useState, useEffect, useCallback} from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import ConversationHeader from "@/Components/App/ConversationHeader";
import MessageItem from "@/Components/App/MessageItem";
import MessageInput from "@/Components/App/MessageInput";
import AttachmentPreviewModal from "@/Components/App/AttachmentPreviewModal";
import { useEventBus } from "@/EventBus";
import { useToast } from "@/ToastContext";
import { router, usePage } from "@inertiajs/react";


function Home({ messages = null, selectedConversation = null }) {
    const toast = useToast();
    const currentUser = usePage().props.auth.user;
    const [localMessages, setLocalMessages] = useState([]);
    const [noMoreMessages, setNoMoreMessages] = useState(false);
    const [scrollFromBottom, setScrollFromBottom] = useState(0);
    const loadMoreIntersect = useRef(null);
    const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState({});
    const messagesCtrRef = useRef(null);
    const { on } = useEventBus();


    //cases for new message ceated
    const messageCreated = (message) => {
        const selectedId = Number(selectedConversation?.id);
        const senderId = Number(message.sender_id);
        const receiverId = Number(message.receiver_id);
        const groupId = Number(message.group_id);

        const isCurrentGroup =
            selectedConversation?.is_group &&
            selectedId === groupId;

        const isCurrentUser =
            selectedConversation?.is_user &&
            (
                selectedId === senderId ||
                selectedId === receiverId
            );

        if (isCurrentGroup || isCurrentUser) {
            setLocalMessages((prevMessages) => [
                ...prevMessages,
                message,
            ]);
        }
    };

    const messageDeleted = ({ id }) => {
        setLocalMessages((prevMessages) =>
            prevMessages.filter((message) => message.id !== id)
        );
    };

    const groupDeleted = ({ id }) => {
        if (
            selectedConversation?.is_group &&
            Number(selectedConversation.id) === Number(id)
        ) {
            toast.info("This group was deleted");
            router.visit(route("dashboard"));
        }
    };

    const groupMemberRemoved = ({ groupId, userId }) => {
        if (
            selectedConversation?.is_group &&
            Number(selectedConversation.id) === Number(groupId) &&
            Number(userId) === Number(currentUser.id)
        ) {
            toast.info("You were removed from this group");
            router.visit(route("dashboard"));
        }
    };

    const loadMoreMessages = useCallback(() => {

        if(noMoreMessages){
            return;
        }
        // Find the first message object
        const firstMessage = localMessages[0];

        axios
            .get(route("message.loadOlder", firstMessage.id))
            .then(({ data }) => {
                if (data.data.length === 0) {
                    setNoMoreMessages(true);
                    return;
                }

                // Calculate how much is scrolled from bottom and scroll to the same position
                // from bottom after messages are loaded
                const scrollHeight = messagesCtrRef.current.scrollHeight;
                const scrollTop = messagesCtrRef.current.scrollTop;
                const clientHeight = messagesCtrRef.current.clientHeight;

                const tmpScrollFromBottom =
                    scrollHeight - scrollTop - clientHeight;

                console.log("tmpScrollFromBottom", tmpScrollFromBottom);

                setScrollFromBottom(
                    scrollHeight - scrollTop - clientHeight
                );
                setLocalMessages((prevMessages) => {
                    return [...data.data.reverse(), ...prevMessages];
                });
            });
    }, [localMessages,noMoreMessages]);

    const onAttachmentClick = (attachments, ind) => {
        setPreviewAttachment({
            attachments,
            ind,
        });

        setShowAttachmentPreview(true);
    };


    //SET SCROLLER kad odemo u novi convo
    useEffect(() => {
        setTimeout(() => {
            if (messagesCtrRef.current) {
                messagesCtrRef.current.scrollTop =
                    messagesCtrRef.current.scrollHeight;
            }
        }, 10);

        //event listener
        const offCreated = on("message.created", messageCreated);
        const offDeleted = on("message.deleted", messageDeleted);
        const offGroupDeleted = on("group.deleted", groupDeleted);
        const offMemberRemoved = on("group.member.removed", groupMemberRemoved);

        setScrollFromBottom(0); //proveravamo za null pa ne sme null da bude ovde
        setNoMoreMessages(false);

        return () => {
            offCreated();
            offDeleted();
            offGroupDeleted();
            offMemberRemoved();
        };

    }, [selectedConversation]);

    useEffect(() => {
        setLocalMessages(messages ? messages.data.reverse() : []);
    }, [messages]);

    useEffect(() => {
        // Recover scroll from bottom after messages are loaded
        if (messagesCtrRef.current && scrollFromBottom !== null) {
            messagesCtrRef.current.scrollTop =
                messagesCtrRef.current.scrollHeight -
                messagesCtrRef.current.offsetHeight -
                scrollFromBottom;
        }

        if (noMoreMessages) {
            return;
        }
        const observer = new IntersectionObserver(
            (entries) =>
                entries.forEach(
                    (entry) => entry.isIntersecting && loadMoreMessages()
                ),
            {
                rootMargin: "0px 0px 250px 0px",
            }
        );

        if (loadMoreIntersect.current) {
            setTimeout(() => {
                observer.observe(loadMoreIntersect.current);
            }, 100);
        }
        return () => {
            observer.disconnect();
        };




    }, [localMessages]);

    return (
        <>
            {!messages && (
                <div className="flex flex-col gap-8 justify-center items-center text-center h-full opacity-35">
                    <div className="text-2xl md:text-4xl p-16 text-slate-200">
                        Please select conversation to see messages
                    </div>

                    <ChatBubbleLeftRightIcon className="w-32 h-32 inline-block" />
                </div>
            )}

            {messages && (
                //SCROLLABEL AREA
                <>
                
                    <ConversationHeader
                        selectedConversation={selectedConversation}
                    />

                    <div
                        ref={messagesCtrRef}
                        className="flex-1 overflow-y-auto p-5"
                    >
                        {/*message*/ }
                        {localMessages.length === 0 && (
                            <div className="flex justify-center items-center h-full">
                                <div className="text-lg text-slate-200">
                                    No messages found
                                </div>
                            </div>
                        )}

                        {localMessages.length > 0 && (
                            <div className="flex-1 flex flex-col">
                                <div ref={loadMoreIntersect}></div>
                                {localMessages.map((message) => (
                                    <MessageItem
                                        key={message.id}
                                        message={message}
                                        attachmentClick={onAttachmentClick}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <MessageInput conversation={selectedConversation} />
                 
                </>
                
            )}
            {previewAttachment.attachments && (
                <AttachmentPreviewModal
                    attachments={previewAttachment.attachments}
                    index={previewAttachment.ind}
                    show={showAttachmentPreview}
                    onClose={() => setShowAttachmentPreview(false)}
                />
            )}
        </>
    );
}

Home.layout = (page) => {
    return(
        <AuthenticatedLayout user={page.props.auth.user}>
            <ChatLayout children={page} />
        </AuthenticatedLayout>
    );

}

export default Home;