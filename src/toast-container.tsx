import React, { Component } from "react";
import {
    StyleSheet,
    ViewStyle,
    KeyboardAvoidingView,
    Platform,
    View,
    Pressable,
    ScrollView
} from "react-native";
import Toast, { ToastOptions, ToastProps } from "./toast";

export interface Props extends ToastOptions {
    renderToast?(toast: ToastProps): JSX.Element;
    renderType?: { [type: string]: (toast: ToastProps) => JSX.Element };
    offset?: number;
    offsetTop?: number;
    offsetBottom?: number;
    swipeEnabled?: boolean;
    foldIcon?: JSX.Element;
    clearIcon?: JSX.Element;
}

interface State {
    foldedToast: ToastProps;
    toastsHistory: Array<ToastProps>;
    unfolded: boolean;
    unfoldedWidth: number;
    visible: boolean;
}

class ToastContainer extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            foldedToast: this.dummyToast,
            toastsHistory: [],
            unfolded: false,
            unfoldedWidth: 0,
            visible: true
        };
    }

    componentDidUpdate(): void {
        // Without this unfolded view with remain oppened empty showing only buttons
        if (this.state.foldedToast === this.dummyToast && this.state.toastsHistory.length === 0 && this.state.unfolded) {
            this.setState({ unfolded: false }); 
        }
    }

    // Placeholder toast 
        dummyToast = {
        id: 'dummy',
        onDestroy: () => {},
        message: '',
        open: false,
        onHide: () => {}
    }

    static defaultProps: Props = {
        placement: "bottom",
        offset: 10,
        swipeEnabled: true,
    };

    /**
     * Toggles toast container visibility
     * @params show: boolean
     * @returns 
     */
    toggle = (show: boolean) => {
        this.setState({ visible: show });
    } 
    /**
     * Shows a new toast
     * @param message: string | JSX.Element
     * @param toastOptions?: ToastOptions
     * @returns id: string
     */
    show = (message: string | JSX.Element, toastOptions?: ToastOptions) => {
        let id = toastOptions?.id || Math.random().toString();
        // Function invoked on swipe dismiss or button dismiss
        const onDestroy = () => {
            toastOptions?.onClose && toastOptions?.onClose();
            // Conditionaly update state to avoid unnecessary operations
            if(this.state.foldedToast.id === id) {
                return this.setState({ foldedToast: this.dummyToast});
            }
            this.setState({ toastsHistory: this.state.toastsHistory.filter((t) => t.id !== id) });
        };

        const newToast: ToastProps = {
            id,
            onDestroy,
            message,
            open: true,
            onHide: () => this.hide(id),
            ...this.props,
            ...toastOptions,
        }

        requestAnimationFrame(() => {
            // If foldedToast is dummy, replace it with the newToast
            if(this.state.foldedToast === this.dummyToast) {
                this.setState({ foldedToast: newToast });
            } else {
                // Otherwise, push current toast to the top of history and then replace newToast as folded
                this.setState(
                    {
                        toastsHistory: [
                            this.state.foldedToast,
                            ...this.state.toastsHistory
                        ],
                        foldedToast: newToast
                    }
                )
            }
            });
            return id;
    };

    switchUnfoldedState = () => {
        this.setState({
            unfolded: !this.state.unfolded
        });
    }

    /**
     * Updates a toast, To use this create you must pass an id to show method first, then pass it here to update the toast.
     * @param id: string
     * @param message: string | JSX.Element
     * @param toastOptions?: ToastOptions
     * @returns void
     */
    update = (
        id: string,
        message: string | JSX.Element,
        toastOptions?: ToastOptions
    ) => {
        if(this.state.foldedToast.id === id) {
            // if expression false then keep original, else set new message
            // if message undefined, expression false (undefined !== null = true but message = undefined makes expression false)
            message = message && message !== this.state.foldedToast.message && message !== null ? message : this.state.foldedToast.message;
            toastOptions = toastOptions && toastOptions !== this.state.foldedToast && toastOptions !== null ? {...this.state.foldedToast, ...toastOptions} : {...this.state.foldedToast};
            this.setState({ 
                foldedToast: {...this.state.foldedToast, ...toastOptions, message} 
            });
        }
        else {
            let foundToast = this.state.toastsHistory.find((t) => t.id === id);
            // @ts-expect-error
            message = message && message !== null ? message : foundToast.message;
            toastOptions = toastOptions ? {...foundToast, ...toastOptions} : {...foundToast}
            this.setState({ 
                toastsHistory: this.state.toastsHistory.map((t) => t.id === id ? {...t, ...toastOptions, message} : t) 
            });
        };
    };

    /**
     * Returns toast with given ID
     * @param id 
     * @returns ToastProps |  undefined
     * 
     */
    getNotificationById = (id: string) => {
        if(this.state.foldedToast.id === id) {
            return this.state.foldedToast;
        }

        if(this.state.toastsHistory.length > 0) {
            return this.state.toastsHistory.find((toast) => toast.id === id);
        }
        return;
    }

    /**
     * Removes a toast from stack
     * @param id: string
     * @returns void
     */
    hide = (id: string) => {
        if(this.state.foldedToast.id === id) return this.setState({ foldedToast: {...this.state.foldedToast, open: false}})
        return this.setState({ toastsHistory: this.state.toastsHistory.map((t) => t.id === id ? { ...t, open: false } : t) });
    };

    /**
     * Removes all toasts in stack
     * @returns void
     */
    hideAll = () => {
        this.setState({
            foldedToast: {...this.state.foldedToast, open: false},
            toastsHistory: this.state.toastsHistory.map((t) => ({ ...t, open: false })),
            unfolded: false
        });
    };

    /**
     * Check if a toast is currently open
     * @params id: string
     * @returns boolean
     */
    isOpen = (id: string) => {
        if(this.state.foldedToast.id === id && this.state.foldedToast.open) {
            return true;
        } else {
            return this.state.toastsHistory.some((t) => t.id === id && t.open);
        }
    }

    renderToast() {
        const { foldedToast, toastsHistory } = this.state;
        let { offset, offsetBottom } = this.props;
        let style: ViewStyle = {
            bottom: offsetBottom || offset,
            justifyContent: "flex-end",
            flexDirection: "column",
        };

        // Single toast with props
        if (foldedToast !== this.dummyToast || toastsHistory.length > 0) {
            const toast = foldedToast !== this.dummyToast ? foldedToast : toastsHistory.length > 0 ? toastsHistory[0] : this.dummyToast;
            // @ts-expect-error
            const onPress = toastsHistory.length > 0 && foldedToast !== this.dummyToast ? () => this.switchUnfoldedState() : toast.onPress ? toast.onPress : undefined;
            const type = toastsHistory.length > 0 && foldedToast !== this.dummyToast ? 'multiple' : undefined;

            return (
                <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "position" : undefined}
                pointerEvents="box-none"
                style={[styles.container, style]}
                >
                    <Toast key={toast.id} {...toast} onPress={onPress} type={type} />
                </KeyboardAvoidingView>
                );
        } else return null;
    }

    toastHistoryExists: boolean = this.state.toastsHistory.length > 0;
    foldedToastExists: boolean = this.state.foldedToast !== this.dummyToast;

    unfoldedView = () => {
        let shouldRender = this.foldedToastExists || this.toastHistoryExists;
        return shouldRender && 
        <KeyboardAvoidingView 
            style={unfoldedStyles.container}
        >	
            <View style={unfoldedStyles.buttons}>
                <Pressable onPress={() => this.switchUnfoldedState()} >{ this.props.foldIcon }</Pressable>
                <Pressable onPress={() => this.hideAll()} >{ this.props.clearIcon }</Pressable>
            </View>
            <ScrollView contentContainerStyle={unfoldedStyles.scroll} style={unfoldedStyles.scrollContainer}>
                {this.foldedToastExists && <Toast key={this.state.foldedToast.id} {...this.state.foldedToast} type='closeable' />}
                {this.toastHistoryExists && this.state.toastsHistory.map((t) => <Toast key={t.id} {...t} type='closeable' />)}
            </ScrollView>
        </KeyboardAvoidingView>
    }

    render() {
        return (
            <>
                {this.state.visible ? (this.state.unfolded ? this.unfoldedView() : this.renderToast()) : null}
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 0,
        position: "absolute",
        zIndex: 999999,
        elevation: 999999,
        flexDirection: 'column',
        width: '100%',
        maxWidth: 360,
        maxHeight: 90,
        minHeight: 74,
        minWidth: 358,
        padding: 10,
        left: '50%',
        //@ts-expect-error
        transform: [{translateX: '-50%'}],
    },

    message: {
        color: "white",
    },

    fake: {
        position: 'absolute',
        width: '90%',
        height: 5,
        borderBottomStartRadius: 6,
        borderBottomEndRadius: 6
    }
});

const unfoldedStyles = StyleSheet.create({
    container: {
        flex: 0,
        zIndex: 999999,
        maxHeight: "50%",
        position: 'absolute',
        flexDirection: 'column',
        bottom: 65,
        width: '100%',
        maxWidth: 360,
        minWidth: 350,
        left: '50%',
        //@ts-expect-error
        transform: [{translateX: '-50%'}]
    },

    scrollContainer: {
        marginTop: 8
    },

    scroll: {
        position: 'relative',
        paddingTop: 10,
        flexDirection: 'column',
    },
    buttons: {
        flexDirection: 'row',
        alignSelf: 'flex-end',
    },
});

export default ToastContainer;