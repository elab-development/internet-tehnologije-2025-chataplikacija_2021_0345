import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import TextInput from "@/Components/TextInput";
import ConversationItem from "@/Components/App/ConversationItem";
import GroupModal from "@/Components/App/GroupModal";
import { useEventBus } from '@/EventBus';



const ChatLayout = ({ children}) => {

    const page = usePage();
    const conversations = page.props.conversations;
    const selectedConversation = page.props.selectedConversation;
    const [localConversations, setLocalConversations] = useState([]);
    const [sortedConversations, setSortedConversations] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState({});
    const [showGroupModal, setShowGroupModal] = useState(false);
    const {on} = useEventBus();

    const isUserOnline = (userId) => !!onlineUsers[userId];

    console.log('Conversations:', conversations);
    console.log('Selected Conversation:', selectedConversation);

    const onSearch = (ev) => {
        const search = ev.target.value.toLowerCase();

        setLocalConversations(
            conversations.filter((conversation) => {
                return conversation.name.toLowerCase().includes(search);
        
            })
        );
    };

    useEffect(() => {
        const offCreated = on("message.created", messageCreated);
        const offGroupDeleted = on("group.deleted", groupDeleted);

        return () => {
            offCreated();
            offGroupDeleted();
        };
    }, [on]);

    const groupDeleted = ({ id }) => {
        setLocalConversations((oldConversations) =>
            oldConversations.filter(
                (conversation) => !(conversation.is_group && conversation.id == id)
            )
        );
    };

    const messageCreated = (message) => {
        setLocalConversations((oldUsers) => {
            return oldUsers.map((u) => {
                // If the message is for user
                if (
                    message.receiver_id &&
                    !u.is_group &&
                    (u.id == message.sender_id || u.id == message.receiver_id)
                ) {
                    u.last_message = message.message;
                    u.last_message_date = message.created_at;
                    return u;
                }

                // If the message is for group
                if (
                    message.group_id &&
                    u.is_group &&
                    u.id == message.group_id
                ) {
                    u.last_message = message.message;
                    u.last_message_date = message.created_at;
                    return u;
                }

                return u;
            });
        });
    };

    useEffect(() => {
        setSortedConversations(
            localConversations.sort((a, b) => {
                if(a.blocked_at && b.blocked_at) {
                    return a.blocked_at > b.blocked_at ? 1 : -1;
                } else if(a.blocked_at) {
                    return 1;
                } else if(b.blocked_at) {
                    return -1;
                }
                if(a.last_message_date && b.last_message_date) {
                    return b.last_message_date.localeCompare(a.last_message_date);
                } else if(a.last_message_date) {
                    return -1;
                } else if(b.last_message_date) {
                    return 1;
                } else {
                    return 0;
                }
            })
        );   

    }, [localConversations]);

    //kad se menja convo 
    useEffect(() => {
        setLocalConversations(conversations);

    }, [conversations]);

    useEffect(() => {
        window.Echo.join('online')            
            .here((users) => {
                const onlineUsersObj = Object.fromEntries(
                    users.map((user) => [user.id, user]));
                setOnlineUsers((previousOnlineUsers) => {
                    return { ...previousOnlineUsers, ...onlineUsersObj };  //catch case, vrv ne radi nista ali za svaki sl
                });
            })
            .joining((user) => {
                setOnlineUsers((previousOnlineUsers) => {
                    const updatedUsers = {...previousOnlineUsers};
                    updatedUsers[user.id] = user;
                    return updatedUsers;
                });
            })
            .leaving((user) => {
                setOnlineUsers((previousOnlineUsers) => {
                    const updatedUsers = {...previousOnlineUsers};
                    delete updatedUsers[user.id];
                    return updatedUsers;
                });
            }).error((error) => {
                console.error('Error joining channel:', error);
            });

        return () => {
            window.Echo.leave('online');
        };    
    }, []);

    return (
        <>
            <div className="flex-1 w-full flex overflow-hidden">
                <div
                    className={`transition-all w-full sm:w-[220px] md:w-[300px] bg-slate-800
                        flex flex-col overflow-hidden ${
                            selectedConversation ? "-ml-[100%] sm:ml-0" : ""
                        }`}
                >
                        
                        <div className="flex items-center justify-between py-2 px-3 text-xl font-medium text-grey-200">
                            My Conversations

                            <div
                                className="tooltip tooltip-left"
                                data-tip="Create new Group"
                            >
                                <button
                                    onClick={(ev) => setShowGroupModal(true)}
                                    className="text-gray-400 hover:text-gray-200"
                                >
                                    <PencilSquareIcon className="w-4 h-4 inline-block ml-2" />
                                </button>

                            </div>
                        </div>

                        
                        <div className="p-3">
                            <TextInput
                                onKeyUp={onSearch}
                                placeholder="Filter users and groups"
                                className="w-full"
                            />
                        </div>
                        <div className="flex-1 overflow-auto">
                            {sortedConversations &&
                                sortedConversations.map((conversation) => (
                                    <ConversationItem
                                        key={`${
                                            conversation.is_group
                                                ? "group_"
                                                : "user_"
                                        }${conversation.id}`}
                                        conversation={conversation}
                                        selectedConversation={selectedConversation}
                                         online={
                                            conversation.is_user
                                                ? isUserOnline(conversation.id)
                                                : null
                                        }
                                    />
                                ))}
                        </div>

                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    {children}
                </div>
            </div>

            <GroupModal
                show={showGroupModal}
                onClose={() => setShowGroupModal(false)}
            />
        </>

    );
};

export default ChatLayout;