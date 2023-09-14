import React, { Component } from 'react';
import {
    StyleSheet,
    ViewStyle,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    SafeAreaView,
    Pressable,
    Text,
} from 'react-native';
import Toast, { ToastOptions, ToastProps } from './toast';

const { width } = Dimensions.get('window');

export interface Props extends ToastOptions {
    renderToast?(toast: ToastProps): JSX.Element;
    renderType?: { [type: string]: (toast: ToastProps) => JSX.Element };
    offsetBottom?: number;
    swipeEnabled?: boolean;
}

interface State {
    toasts: Array<ToastProps>;
    isUnfolded: boolean;
}

class ToastContainer extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            toasts: [],
            isUnfolded: false,
        };
    }

    static defaultProps: Props = {
        placement: 'bottom',
        offsetBottom: 10,
        swipeEnabled: true,
        dismissIcon: (
            <Text
                style={{
                    color: 'white',
                    backgroundColor: 'black',
                    padding: 10,
                    borderRadius: 5,
                }}
            >
                Please provide an Icon to ToastProvider's dismissIcon prop
            </Text>
        ),
        foldIcon: (
            <Text
                style={{
                    color: 'white',
                    backgroundColor: 'black',
                    padding: 10,
                    borderRadius: 5,
                }}
            >
                Please provide an Icon to ToastProvider's foldIcon prop
            </Text>
        ),
    };

    componentDidUpdate(): void {
        if (this.state.toasts.length <= 1 && this.state.isUnfolded) {
            this.setState({
                isUnfolded: false,
            });
        }
    }

    /**
     * Shows a new toast. Returns id
     */
    show = (message: string | JSX.Element, toastOptions?: ToastOptions) => {
        let id = toastOptions?.id || Math.random().toString();
        const onDestroy = () => {
            toastOptions?.onClose && toastOptions?.onClose();
            this.setState({
                toasts: this.state.toasts.filter((t) => t.id !== id),
            });
        };

        requestAnimationFrame(() => {
            this.setState({
                toasts: [
                    {
                        id,
                        onDestroy,
                        message,
                        open: true,
                        onHide: () => this.hide(id),
                        ...this.props,
                        ...toastOptions,
                    },
                    ...this.state.toasts.filter((t) => t.open),
                ],
            });
        });

        return id;
    };

    /**
     * Updates a toast, To use this create you must pass an id to show method first, then pass it here to update the toast.
     */
    update = (
        id: string,
        message: string | JSX.Element,
        toastOptions?: ToastOptions,
    ) => {
        this.setState({
            toasts: this.state.toasts.map((toast) =>
                toast.id === id
                    ? { ...toast, message, ...toastOptions }
                    : toast,
            ),
        });
    };

    /**
     * Removes a toast from stack
     */
    hide = (id: string) => {
        this.setState({
            toasts: this.state.toasts.map((t) =>
                t.id === id ? { ...t, open: false } : t,
            ),
        });
    };

    /**
     * Removes all toasts in stack
     */
    hideAll = () => {
        this.setState({
            toasts: this.state.toasts.map((t) => ({ ...t, open: false })),
        });
    };

    /**
     * Check if a toast is currently open
     */
    isOpen = (id: string) => {
        return this.state.toasts.some((t) => t.id === id && t.open);
    };

    renderToast() {
        const { toasts } = this.state;
        let { offsetBottom } = this.props;
        let style: ViewStyle = {
            bottom: offsetBottom,
            width: width,
            justifyContent: 'flex-end',
            flexDirection: 'column',
        };
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'position' : undefined}
                style={[styles.container, style]}
                pointerEvents="box-none"
            >
                <SafeAreaView>
                    {toasts.length > 1 ? (
                        <Toast
                            key={toasts[0].id}
                            {...toasts[0]}
                            type="multiple"
                            swipeEnabled={false}
                            onPress={() => {
                                this.setState({
                                    isUnfolded: !this.state.isUnfolded,
                                });
                            }}
                        />
                    ) : (
                        toasts.length > 0 && (
                            <Toast key={toasts[0].id} {...toasts[0]} />
                        )
                    )}
                </SafeAreaView>
            </KeyboardAvoidingView>
        );
    }

    renderUnfolded() {
        const { toasts } = this.state;
        let { offsetBottom } = this.props;
        let style: ViewStyle = {
            bottom: offsetBottom,
            width: width,
            justifyContent: 'flex-end',
            flexDirection: 'column',
        };
        let buttonStyle: ViewStyle = {
            padding: 10,
            backgroundColor: '#1C1C1E',
            borderRadius: 4,
        };
        return (
            <>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'position' : undefined}
                    style={[styles.container, style]}
                    pointerEvents="box-none"
                >
                    <SafeAreaView
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            width: (toasts[0].style as ViewStyle)?.width ?? 358,
                            justifyContent: 'flex-end',
                            alignSelf: 'center',
                            marginBottom: 8,
                        }}
                    >
                        <Pressable
                            onPress={() => {
                                this.setState({
                                    isUnfolded: !this.state.isUnfolded,
                                });
                            }}
                            style={[buttonStyle, { marginRight: 4 }]}
                        >
                            {this.props.foldIcon}
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                this.hideAll();
                            }}
                            style={buttonStyle}
                        >
                            {this.props.dismissIcon}
                        </Pressable>
                    </SafeAreaView>
                    <SafeAreaView>
                        {toasts.map((toast, index) => {
                            return (
                                <Toast
                                    key={toast.id}
                                    {...toast}
                                    style={{
                                        ...(toast.style as object),
                                        marginBottom:
                                            index < toasts.length - 1 ? 4 : 0,
                                    }}
                                />
                            );
                        })}
                    </SafeAreaView>
                </KeyboardAvoidingView>
                <Pressable
                    style={{
                        height: '100vh',
                        width: '100vw',
                        position: 'absolute',
                        backgroundColor: '#000000CC',
                    }}
                    onPress={() => {
                        this.setState({
                            isUnfolded: !this.state.isUnfolded,
                        });
                    }}
                />
            </>
        );
    }

    render() {
        return (
            <>
                {this.state.isUnfolded
                    ? this.renderUnfolded()
                    : this.renderToast()}
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 0,
        // @ts-ignore: fixed is available on web.
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        maxWidth: '100%',
        zIndex: 999999,
        elevation: 999999,
        alignSelf: 'center',
        ...(Platform.OS === 'web'
            ? { overflow: 'hidden', userSelect: 'none' }
            : null),
    },
    message: {
        color: '#333',
    },
});

export default ToastContainer;
