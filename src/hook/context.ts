import React from 'react';
import ToastContainer from '../toast-container';

export type ToastType = Pick<
    ToastContainer,
    'show' | 'update' | 'hide' | 'hideAll' | 'isOpen' | 'toggleToastVisibility'
>;

const ToastContext = React.createContext({} as ToastType);

export default ToastContext;
