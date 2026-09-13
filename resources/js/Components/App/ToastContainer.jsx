import { XMarkIcon } from "@heroicons/react/24/solid";
import { useToast } from "@/ToastContext";

const alertClassByType = {
    success: "alert-success",
    error: "alert-error",
    info: "alert-info",
};

const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="toast toast-top toast-end z-50">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    onClick={() => {
                        toast.onClick?.();
                        removeToast(toast.id);
                    }}
                    className={
                        "alert " +
                        (alertClassByType[toast.type] || alertClassByType.info) +
                        (toast.onClick ? " cursor-pointer" : "")
                    }
                >
                    <span>{toast.message}</span>

                    <button
                        onClick={(ev) => {
                            ev.stopPropagation();
                            removeToast(toast.id);
                        }}
                        className="ml-2"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
