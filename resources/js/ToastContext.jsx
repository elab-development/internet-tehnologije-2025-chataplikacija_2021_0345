import React, { useCallback, useState } from "react";

export const ToastContext = React.createContext();

const DEFAULT_DURATION = 4000;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (message, type = "info", { duration = DEFAULT_DURATION, onClick } = {}) => {
            const id = Date.now() + Math.random();

            setToasts((prev) => [...prev, { id, message, type, onClick }]);

            setTimeout(() => removeToast(id), duration);

            return id;
        },
        [removeToast]
    );

    const value = {
        toasts,
        removeToast,
        showToast,
        success: (message, options) => showToast(message, "success", options),
        error: (message, options) => showToast(message, "error", options),
        info: (message, options) => showToast(message, "info", options),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    return React.useContext(ToastContext);
};
