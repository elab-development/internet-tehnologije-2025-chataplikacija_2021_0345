import { useEffect, useState } from "react";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import {
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowDownTrayIcon,
    PaperClipIcon,
} from "@heroicons/react/24/solid";
import { isImage, isPDF, isVideo, isPreviewable } from "@/helpers";

const AttachmentPreviewModal = ({
    attachments = [],
    index = 0,
    show = false,
    onClose = () => {},
}) => {
    const [currentIndex, setCurrentIndex] = useState(index);

    useEffect(() => {
        setCurrentIndex(index);
    }, [index, show]);

    const attachment = attachments[currentIndex];

    const showPrev = (ev) => {
        ev.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + attachments.length) % attachments.length);
    };

    const showNext = (ev) => {
        ev.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % attachments.length);
    };

    if (!attachment) {
        return null;
    }

    return (
        <Transition show={show} leave="duration-200">
            <Dialog
                as="div"
                className="fixed inset-0 z-50 flex flex-col transform transition-all"
                onClose={onClose}
            >
                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/90" />
                </TransitionChild>

                <div className="relative z-10 flex justify-end items-center gap-2 p-4">
                    <a
                        href={attachment.url}
                        download
                        className="w-10 h-10 flex items-center justify-center text-gray-200 hover:text-white bg-gray-800/80 hover:bg-gray-700 rounded-full"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                    </a>

                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center text-gray-200 hover:text-white bg-gray-800/80 hover:bg-gray-700 rounded-full"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <DialogPanel
                    className="relative z-10 flex-1 flex items-center justify-center px-4 pb-6 overflow-hidden"
                    onClick={onClose}
                >
                    {attachments.length > 1 && (
                        <button
                            onClick={showPrev}
                            className="absolute left-4 w-10 h-10 flex items-center justify-center text-gray-200 hover:text-white bg-gray-800/80 hover:bg-gray-700 rounded-full"
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                    )}

                    <div
                        className="max-w-full max-h-full flex flex-col items-center gap-3"
                        onClick={(ev) => ev.stopPropagation()}
                    >
                        {isImage(attachment) && (
                            <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="max-w-full max-h-[80vh] object-contain"
                            />
                        )}

                        {isVideo(attachment) && (
                            <video
                                src={attachment.url}
                                controls
                                autoPlay
                                className="max-w-full max-h-[80vh]"
                            />
                        )}

                        {isPDF(attachment) && (
                            <iframe
                                src={attachment.url}
                                className="w-[80vw] h-[80vh] bg-white"
                            />
                        )}

                        {!isPreviewable(attachment) && (
                            <div className="flex flex-col items-center gap-3 text-gray-200 p-10">
                                <PaperClipIcon className="w-16 h-16" />
                            </div>
                        )}

                        <div className="text-gray-300 text-sm">
                            {attachment.name}
                        </div>
                    </div>

                    {attachments.length > 1 && (
                        <button
                            onClick={showNext}
                            className="absolute right-4 w-10 h-10 flex items-center justify-center text-gray-200 hover:text-white bg-gray-800/80 hover:bg-gray-700 rounded-full"
                        >
                            <ChevronRightIcon className="w-6 h-6" />
                        </button>
                    )}
                </DialogPanel>
            </Dialog>
        </Transition>
    );
};

export default AttachmentPreviewModal;
